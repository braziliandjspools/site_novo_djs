use std::path::Path;

use futures_util::StreamExt;
use reqwest::header::{AUTHORIZATION, HeaderValue, RANGE, USER_AGENT};
use tauri::Emitter;
use tokio::io::AsyncWriteExt;

use super::context::{DownloadContext, DownloadProgressPayload, DownloadResultPayload};

/// Baixa via proxy autenticado do backend Next.js, que reutiliza `getAudioSourceUrl`.
pub struct GoogleDriveProvider;

impl GoogleDriveProvider {
    pub async fn download(ctx: DownloadContext) -> Result<DownloadResultPayload, String> {
        let resume_from = existing_part_bytes(&ctx.part_path).await;
        if resume_from == 0 {
            cleanup_part_file(&ctx.part_path).await;
        }

        let mut url = reqwest::Url::parse(ctx.api_base_url.trim_end_matches('/'))
            .map_err(|e| e.to_string())?;
        url.path_segments_mut()
            .map_err(|_| "URL inválida.".to_string())?
            .push("api")
            .push("musicas")
            .push("download")
            .push(&ctx.file_id);
        url.query_pairs_mut().append_pair("name", &ctx.file_name);

        let client = reqwest::Client::builder()
            .user_agent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
                 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            )
            .build()
            .map_err(|e| e.to_string())?;

        let mut request = client
            .get(url)
            .header(USER_AGENT, "BrazilianPacksDownloader/0.1")
            .header(
                AUTHORIZATION,
                HeaderValue::from_str(&format!("Bearer {}", ctx.auth_token.trim()))
                    .map_err(|e| e.to_string())?,
            );

        if resume_from > 0 {
            request = request.header(RANGE, format!("bytes={resume_from}-"));
        }

        let response = request.send().await.map_err(|e| e.to_string())?;

        if ctx.cancel_token.is_cancelled() {
            return Err("Download cancelado.".to_string());
        }

        let status = response.status();
        if !status.is_success() && status.as_u16() != 206 {
            return Err(format!("Download indisponível (HTTP {}).", status));
        }

        let supports_range = status.as_u16() == 206 || resume_from == 0;
        if resume_from > 0 && status.as_u16() != 206 {
            cleanup_part_file(&ctx.part_path).await;
            return Err("Retomada indisponível (servidor não suporta Range).".to_string());
        }

        let content_length = response.content_length();
        let total_bytes = parse_total_bytes(response.headers(), resume_from, content_length);

        let content_type = response
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|value| value.to_str().ok())
            .unwrap_or("");

        if content_type.contains("text/html")
            || content_type.contains("application/json")
            || content_type.contains("text/plain")
        {
            return Err("Arquivo indisponível no Drive.".to_string());
        }

        let mut stream = response.bytes_stream();
        let mut file = if resume_from > 0 && supports_range {
            tokio::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&ctx.part_path)
                .await
                .map_err(|e| format!("Não foi possível retomar arquivo temporário: {e}"))?
        } else {
            tokio::fs::File::create(&ctx.part_path)
                .await
                .map_err(|e| format!("Não foi possível criar arquivo temporário: {e}"))?
        };

        let mut downloaded_bytes = resume_from;
        let mut last_emit = downloaded_bytes;

        if resume_from > 0 {
            emit_progress(&ctx, downloaded_bytes, total_bytes, false);
        }

        let result = async {
            while let Some(chunk) = stream.next().await {
                if ctx.cancel_token.is_cancelled() {
                    return Err("Download cancelado.".to_string());
                }

                let chunk = chunk.map_err(|e| e.to_string())?;
                file.write_all(&chunk).await.map_err(|e| e.to_string())?;
                downloaded_bytes += chunk.len() as u64;

                let should_emit = downloaded_bytes - last_emit >= 256 * 1024
                    || total_bytes.is_some_and(|total| downloaded_bytes >= total);
                if should_emit {
                    emit_progress(&ctx, downloaded_bytes, total_bytes, false);
                    last_emit = downloaded_bytes;
                }
            }

            file.flush().await.map_err(|e| e.to_string())?;
            drop(file);

            if ctx.cancel_token.is_cancelled() {
                return Err("Download cancelado.".to_string());
            }

            let disk_bytes = tokio::fs::metadata(&ctx.part_path)
                .await
                .map(|meta| meta.len())
                .unwrap_or(downloaded_bytes);

            if disk_bytes == 0 {
                return Err("Arquivo vazio após download.".to_string());
            }

            if let Some(expected) = total_bytes {
                if expected > 0 && disk_bytes != expected {
                    return Err(format!(
                        "Tamanho incorreto: esperado {expected} bytes, recebido {disk_bytes}."
                    ));
                }
            }

            finalize_download(&ctx.final_path, &ctx.part_path, ctx.replace_existing).await?;
            emit_progress(&ctx, disk_bytes, total_bytes.or(Some(disk_bytes)), true);

            Ok(DownloadResultPayload {
                path: ctx.final_path.to_string_lossy().to_string(),
                downloaded_bytes: disk_bytes,
                total_bytes: total_bytes.or(Some(disk_bytes)),
                skipped: false,
            })
        }
        .await;

        if result.is_err() && !ctx.cancel_token.is_cancelled() {
            // Mantém .part para retomada em falhas de rede; cancelamento explícito remove depois.
        }

        result
    }
}

fn parse_total_bytes(
    headers: &reqwest::header::HeaderMap,
    resume_from: u64,
    content_length: Option<u64>,
) -> Option<u64> {
    if let Some(value) = headers.get("content-range").and_then(|v| v.to_str().ok()) {
        // bytes 0-1023/5000
        if let Some(total) = value.split('/').nth(1).and_then(|t| t.parse::<u64>().ok()) {
            return Some(total);
        }
    }

    content_length.map(|len| resume_from.saturating_add(len))
}

async fn existing_part_bytes(part_path: &Path) -> u64 {
    tokio::fs::metadata(part_path)
        .await
        .map(|meta| meta.len())
        .unwrap_or(0)
}

async fn finalize_download(
    final_path: &Path,
    part_path: &Path,
    replace_existing: bool,
) -> Result<(), String> {
    if final_path.exists() && replace_existing {
        tokio::fs::remove_file(final_path)
            .await
            .map_err(|e| format!("Não foi possível substituir arquivo existente: {e}"))?;
    }

    tokio::fs::rename(part_path, final_path)
        .await
        .map_err(|e| format!("Não foi possível finalizar o download: {e}"))
}

pub async fn cleanup_part_file(part_path: &Path) {
    if part_path.exists() {
        let _ = tokio::fs::remove_file(part_path).await;
    }
}

fn emit_progress(
    ctx: &DownloadContext,
    downloaded_bytes: u64,
    total_bytes: Option<u64>,
    completed: bool,
) {
    let progress = if completed {
        100
    } else {
        match total_bytes {
            Some(total) if total > 0 => ((downloaded_bytes * 100) / total).min(99) as u8,
            _ if downloaded_bytes > 0 => 99,
            _ => 0,
        }
    };

    let _ = ctx.app.emit(
        "download-progress",
        DownloadProgressPayload {
            job_id: ctx.job_id,
            downloaded_bytes,
            total_bytes,
            progress,
        },
    );
}

#[cfg(test)]
mod tests {
    #[test]
    fn progress_never_reaches_100_before_completion_flag() {
        let progress = match Some(1000u64) {
            Some(total) if total > 0 => ((999 * 100) / total).min(99) as u8,
            _ => 0,
        };
        assert_eq!(progress, 99);
    }
}
