use std::path::PathBuf;
use std::sync::Arc;

use serde::Serialize;
use tauri::AppHandle;
use tokio_util::sync::CancellationToken;

use crate::download::speed_limit::GlobalSpeedLimiter;

pub struct DownloadContext {
    pub app: AppHandle,
    pub api_base_url: String,
    pub auth_token: String,
    pub file_id: String,
    pub file_name: String,
    pub final_path: PathBuf,
    pub part_path: PathBuf,
    pub job_id: u32,
    /// Tamanho estimado do job (não usado na barra — só Content-Length real).
    #[allow(dead_code)]
    pub expected_total: Option<u64>,
    pub cancel_token: CancellationToken,
    pub replace_existing: bool,
    pub speed_limiter: Arc<GlobalSpeedLimiter>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgressPayload {
    pub job_id: u32,
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    pub progress: u8,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadResultPayload {
    pub path: String,
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    #[serde(default)]
    pub skipped: bool,
}
