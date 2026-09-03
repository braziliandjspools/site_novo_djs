use std::path::Path;
use std::time::{Duration, Instant};

use futures_util::StreamExt;
use reqwest::header::{AUTHORIZATION, HeaderValue, RANGE, USER_AGENT};
use serde::Deserialize;
use tauri::Emitter;
use tokio::io::AsyncWriteExt;
use tokio::time::timeout;

use super::context::{DownloadContext, DownloadProgressPayload, DownloadResultPayload};

const CONNECT_TIMEOUT: Duration = Duration::from_secs(20);
const SOURCE_RESOLVE_TIMEOUT: Duration = Duration::from_secs(12);
const CHUNK_IDLE_TIMEOUT: Duration = Duration::from_secs(60);
const PROGRESS_BYTES: u64 = 64 * 1024;
const PROGRESS_INTERVAL: Duration = Duration::from_millis(400);

#[derive(Debug, Deserialize)]
struct SourceResponse {
    url: String,
}

/// Baixa do Drive com fallbacks: URL direta do backend → usercontent → proxy autenticado.
pub struct GoogleDriveProvider;

impl GoogleDriveProvider {
    pub async fn download(ctx: DownloadContext) -> Result<DownloadResultPayload, String> {
        let resume_from = existing_part_bytes(&ctx.part_path).await;
        if resume_from == 0 {
            cleanup_part_file(&ctx.part_path).await;
        }

        // Sem timeout global no client — streams longos usam idle timeout por chunk.
        let client = reqwest::Client::builder()
            .user_agent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
                 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            )
            .connect_timeout(CONNECT_TIMEOUT)
            .pool_idle_timeout(Duration::from_secs(90))
            .redirect(reqwest::redirect::Policy::limited(10))
            .build()
            .map_err(|e| e.to_string())?;

        emit_progress(&ctx, resume_from, None, false);

        let mut candidates: Vec<(String, bool, &'static str)> = Vec::new();

        match resolve_direct_source_url(&client, &ctx).await {
            Ok(url) => candidates.push((url, false, "origem")),
            Err(err) => {
                let _ = err;
            }
        }

        candidates.push((build_usercontent_url(&ctx.file_id), false, "drive"));
        candidates.push((build_proxy_url(&ctx)?, true, "proxy"));

        let mut errors: Vec<String> = Vec::new();

        for (url, use_auth, label) in candidates {
            match download_from_url(&client, &ctx, &url, resume_from, use_auth).await {
                Ok(payload) => return Ok(payload),
                Err(err) => {
                    if ctx.cancel_token.is_cancelled() {
                        return Err("Download cancelado.".to_string());
                    }
                    // Retomada inválida: limpa .part e tenta do zero na próxima URL.
                    if err.contains("Retomada indisponível") {
                        cleanup_part_file(&ctx.part_path).await;
                    }
                    errors.push(format!("{label}: {err}"));
                }
            }
        }

        Err(format!(
            "Download falhou. {}",
            errors.join(" | ")
        ))
    }
}

async fn resolve_direct_source_url(
    client: &reqwest::Client,
    ctx: &DownloadContext,
) -> Result<String, String> {
    let mut url = reqwest::Url::parse(ctx.api_base_url.trim_end_matches('/'))
        .map_err(|e| e.to_string())?;
    url.path_segments_mut()
        .map_err(|_| "URL inválida.".to_string())?
        .push("api")
        .push("musicas")
        .push("download")
        .push(&ctx.file_id)
        .push("source");

    let request = client
        .get(url)
        .timeout(SOURCE_RESOLVE_TIMEOUT)
        .header(USER_AGENT, "BrazilianPacksDownloader/0.1")
        .header("X-BP-Client", "downloader")
        .header(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", ctx.auth_token.trim()))
                .map_err(|e| e.to_string())?,
        );

    let response = request
        .send()
        .await
        .map_err(|e| format!("Não foi possível resolver origem: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "Origem indisponível (HTTP {}).",
            response.status()
        ));
    }

    let payload = response
        .json::<SourceResponse>()
        .await
        .map_err(|e| format!("Resposta de origem inválida: {e}"))?;

    if payload.url.trim().is_empty() {
        return Err("Origem vazia.".to_string());
    }

    Ok(payload.url)
}

fn build_usercontent_url(file_id: &str) -> String {
    format!(
        "https://drive.usercontent.google.com/download?id={file_id}&export=download&confirm=t"
    )
}

fn build_proxy_url(ctx: &DownloadContext) -> Result<String, String> {
    let mut url = reqwest::Url::parse(ctx.api_base_url.trim_end_matches('/'))
        .map_err(|e| e.to_string())?;
    url.path_segments_mut()
        .map_err(|_| "URL inválida.".to_string())?
        .push("api")
        .push("musicas")
        .push("download")
        .push(&ctx.file_id);
    url.query_pairs_mut().append_pair("name", &ctx.file_name);
    Ok(url.to_string())
}

async fn download_from_url(
    client: &reqwest::Client,
    ctx: &DownloadContext,
    url: &str,
    resume_from: u64,
    use_auth: bool,
) -> Result<DownloadResultPayload, String> {
    let mut request = client
        .get(url)
        .header(USER_AGENT, "BrazilianPacksDownloader/0.1");

    if use_auth {
        request = request
            .header("X-BP-Client", "downloader")
            .header(
                AUTHORIZATION,
                HeaderValue::from_str(&format!("Bearer {}", ctx.auth_token.trim()))
                    .map_err(|e| e.to_string())?,
            );
    }

    let effective_resume = resume_from;
    if effective_resume > 0 {
        request = request.header(RANGE, format!("bytes={effective_resume}-"));
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("Falha ao iniciar download: {e}"))?;

    if ctx.cancel_token.is_cancelled() {
        return Err("Download cancelado.".to_string());
    }

    let status = response.status();
    if !status.is_success() && status.as_u16() != 206 {
        return Err(format!("Download indisponível (HTTP {}).", status));
    }

    if effective_resume > 0 && status.as_u16() != 206 {
        return Err("Retomada indisponível (servidor não suporta Range).".to_string());
    }

    let content_length = response.content_length();
    let header_total = parse_total_bytes(response.headers(), effective_resume, content_length);
    // Não usa fileSize estimado do job — evita progresso falso e validação errada.
    let total_bytes = header_total;

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
    let mut file = if effective_resume > 0 {
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

    let mut downloaded_bytes = effective_resume;
    let mut last_emit_bytes = downloaded_bytes;
    let mut last_emit_at = Instant::now();

    emit_progress(ctx, downloaded_bytes, total_bytes, false);

    let result = async {
        loop {
            let next = timeout(CHUNK_IDLE_TIMEOUT, stream.next())
                .await
                .map_err(|_| {
                    "Download parado: sem dados do servidor. Verifique a conexão e tente novamente."
                        .to_string()
                })?;

            let Some(chunk) = next else {
                break;
            };

            if ctx.cancel_token.is_cancelled() {
                return Err("Download cancelado.".to_string());
            }

            let chunk = chunk.map_err(|e| e.to_string())?;
            if chunk.is_empty() {
                continue;
            }

            file.write_all(&chunk).await.map_err(|e| e.to_string())?;
            downloaded_bytes += chunk.len() as u64;

            let should_emit = downloaded_bytes - last_emit_bytes >= PROGRESS_BYTES
                || last_emit_at.elapsed() >= PROGRESS_INTERVAL
                || total_bytes.is_some_and(|total| downloaded_bytes >= total);
            if should_emit {
                emit_progress(ctx, downloaded_bytes, total_bytes, false);
                last_emit_bytes = downloaded_bytes;
                last_emit_at = Instant::now();
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

        if let Some(expected) = header_total {
            if expected > 0 && disk_bytes != expected {
                return Err(format!(
                    "Tamanho incorreto: esperado {expected} bytes, recebido {disk_bytes}."
                ));
            }
        }

        finalize_download(&ctx.final_path, &ctx.part_path, ctx.replace_existing).await?;
        emit_progress(ctx, disk_bytes, total_bytes.or(Some(disk_bytes)), true);

        Ok(DownloadResultPayload {
            path: ctx.final_path.to_string_lossy().to_string(),
            downloaded_bytes: disk_bytes,
            total_bytes: total_bytes.or(Some(disk_bytes)),
            skipped: false,
        })
    }
    .await;

    result
}

fn parse_total_bytes(
    headers: &reqwest::header::HeaderMap,
    resume_from: u64,
    content_length: Option<u64>,
) -> Option<u64> {
    if let Some(value) = headers.get("content-range").and_then(|v| v.to_str().ok()) {
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
            _ if downloaded_bytes > 0 => 1,
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
