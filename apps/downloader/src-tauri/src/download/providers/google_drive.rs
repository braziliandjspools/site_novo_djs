use futures_util::StreamExt;
use reqwest::header::{AUTHORIZATION, HeaderValue, USER_AGENT};
use tauri::Emitter;
use tokio::io::AsyncWriteExt;

use super::{DownloadContext, DownloadProgressPayload, DownloadResultPayload};

/// Baixa via proxy autenticado do backend Next.js, que reutiliza `getAudioSourceUrl`.
pub struct GoogleDriveProvider;

impl GoogleDriveProvider {
    pub async fn download(ctx: DownloadContext) -> Result<DownloadResultPayload, String> {
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

        let response = client
            .get(url)
            .header(USER_AGENT, "BrazilianPacksDownloader/0.1")
            .header(
                AUTHORIZATION,
                HeaderValue::from_str(&format!("Bearer {}", ctx.auth_token.trim()))
                    .map_err(|e| e.to_string())?,
            )
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !response.status().is_success() {
            return Err(format!(
                "Download indisponível (HTTP {}).",
                response.status()
            ));
        }

        let total_bytes = response.content_length();
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
        let mut file = tokio::fs::File::create(&ctx.dest_path)
            .await
            .map_err(|e| e.to_string())?;

        let mut downloaded_bytes = 0u64;
        let mut last_emit = 0u64;

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| e.to_string())?;
            file.write_all(&chunk).await.map_err(|e| e.to_string())?;
            downloaded_bytes += chunk.len() as u64;

            let should_emit = downloaded_bytes - last_emit >= 256 * 1024
                || total_bytes.is_some_and(|total| downloaded_bytes >= total);
            if should_emit {
                emit_progress(&ctx, downloaded_bytes, total_bytes);
                last_emit = downloaded_bytes;
            }
        }

        file.flush().await.map_err(|e| e.to_string())?;

        let disk_bytes = tokio::fs::metadata(&ctx.dest_path)
            .await
            .map(|meta| meta.len())
            .unwrap_or(downloaded_bytes);

        if disk_bytes == 0 {
            let _ = tokio::fs::remove_file(&ctx.dest_path).await;
            return Err("Arquivo vazio após download.".to_string());
        }

        if let Some(expected) = total_bytes {
            if expected > 0 && disk_bytes != expected {
                return Err(format!(
                    "Tamanho incorreto: esperado {expected} bytes, recebido {disk_bytes}."
                ));
            }
        }

        emit_progress(&ctx, disk_bytes, total_bytes.or(Some(disk_bytes)));

        Ok(DownloadResultPayload {
            path: ctx.dest_path.to_string_lossy().to_string(),
            downloaded_bytes: disk_bytes,
            total_bytes: total_bytes.or(Some(disk_bytes)),
        })
    }
}

fn emit_progress(ctx: &DownloadContext, downloaded_bytes: u64, total_bytes: Option<u64>) {
    let progress = match total_bytes {
        Some(total) if total > 0 => ((downloaded_bytes * 100) / total).min(100) as u8,
        _ if downloaded_bytes > 0 => 99,
        _ => 0,
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

