use std::sync::Mutex;
use std::time::{Duration, Instant};

use tokio_util::sync::CancellationToken;

/// Limitador global compartilhado por todos os downloads ativos.
/// `limit_bps == 0` significa sem limite.
pub struct GlobalSpeedLimiter {
    inner: Mutex<Inner>,
}

struct Inner {
    limit_bps: u64,
    tokens: f64,
    last_refill: Instant,
}

impl GlobalSpeedLimiter {
    pub fn new(limit_bps: u64) -> Self {
        Self {
            inner: Mutex::new(Inner {
                limit_bps,
                tokens: limit_bps as f64,
                last_refill: Instant::now(),
            }),
        }
    }

    pub fn set_limit_bps(&self, limit_bps: u64) {
        let mut guard = self.inner.lock().expect("speed limiter poisoned");
        guard.limit_bps = limit_bps;
        if limit_bps == 0 {
            guard.tokens = 0.0;
        } else {
            // Recarrega o bucket no novo teto para o limite valer na hora.
            guard.tokens = (guard.tokens).min(limit_bps as f64);
            if guard.tokens <= 0.0 {
                guard.tokens = limit_bps as f64 * 0.1;
            }
            guard.last_refill = Instant::now();
        }
    }

    pub fn limit_bps(&self) -> u64 {
        self.inner.lock().expect("speed limiter poisoned").limit_bps
    }

    /// Consome `bytes` do orçamento global. Aguarda se o conjunto de downloads
    /// já estiver no limite (todos os jobs simultâneos compartilham o mesmo bucket).
    pub async fn acquire(&self, bytes: usize, cancel: &CancellationToken) -> Result<(), String> {
        if bytes == 0 {
            return Ok(());
        }

        let mut remaining = bytes as f64;

        loop {
            if cancel.is_cancelled() {
                return Err("Download cancelado.".to_string());
            }

            let wait = {
                let mut guard = self.inner.lock().expect("speed limiter poisoned");
                if guard.limit_bps == 0 {
                    return Ok(());
                }

                let now = Instant::now();
                let elapsed = now.duration_since(guard.last_refill).as_secs_f64();
                let limit = guard.limit_bps as f64;
                // Capacidade = 1 segundo de tráfego (suaviza picos sem liberar demais).
                guard.tokens = (guard.tokens + elapsed * limit).min(limit);
                guard.last_refill = now;

                if guard.tokens >= remaining {
                    guard.tokens -= remaining;
                    return Ok(());
                }

                if guard.tokens > 0.0 {
                    remaining -= guard.tokens;
                    guard.tokens = 0.0;
                }

                let seconds = remaining / limit;
                Duration::from_secs_f64(seconds.clamp(0.001, 2.0))
            };

            tokio::select! {
                _ = tokio::time::sleep(wait) => {}
                _ = cancel.cancelled() => {
                    return Err("Download cancelado.".to_string());
                }
            }
        }
    }
}
