mod cloudflare_r2;
mod context;
mod google_drive;
mod s3;

pub use context::{DownloadContext, DownloadResultPayload};
pub use google_drive::GoogleDriveProvider;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DownloadProviderKind {
    GoogleDrive,
    CloudflareR2,
    S3,
}

impl DownloadProviderKind {
    pub async fn download(self, ctx: DownloadContext) -> Result<DownloadResultPayload, String> {
        match self {
            Self::GoogleDrive => GoogleDriveProvider::download(ctx).await,
            Self::CloudflareR2 => cloudflare_r2::CloudflareR2Provider::download(ctx).await,
            Self::S3 => s3::S3Provider::download(ctx).await,
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
