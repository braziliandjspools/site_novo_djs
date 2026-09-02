mod cloudflare_r2;
mod google_drive;
mod s3;

use std::path::PathBuf;

use serde::Serialize;
use tauri::AppHandle;

pub use google_drive::GoogleDriveProvider;

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
}

pub struct DownloadContext {
    pub app: AppHandle,
    pub api_base_url: String,
    pub auth_token: String,
    pub file_id: String,
    pub file_name: String,
    pub dest_path: PathBuf,
    pub job_id: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DownloadProviderKind {
    GoogleDrive,
    CloudflareR2,
    S3,
}

impl DownloadProviderKind {
    pub fn id(self) -> &'static str {
        match self {
            Self::GoogleDrive => "google_drive",
            Self::CloudflareR2 => "cloudflare_r2",
            Self::S3 => "s3",
        }
    }

    pub async fn download(self, ctx: DownloadContext) -> Result<DownloadResultPayload, String> {
        match self {
            Self::GoogleDrive => GoogleDriveProvider.download(ctx).await,
            Self::CloudflareR2 => cloudflare_r2::CloudflareR2Provider.download(ctx).await,
            Self::S3 => s3::S3Provider.download(ctx).await,
        }
    }
}

pub fn resolve_provider(provider: &str) -> Result<DownloadProviderKind, String> {
    let normalized = provider.trim().to_ascii_lowercase().replace('-', "_");
    match normalized.as_str() {
        "google_drive" => Ok(DownloadProviderKind::GoogleDrive),
        "cloudflare_r2" => Ok(DownloadProviderKind::CloudflareR2),
        "s3" => Ok(DownloadProviderKind::S3),
        _ => Err(format!("Provider de download não suportado: {provider}")),
    }
}
