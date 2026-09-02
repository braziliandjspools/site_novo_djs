use super::{DownloadContext, DownloadResultPayload};

/// Placeholder — implementar quando arquivos migrarem para R2.
pub struct CloudflareR2Provider;

impl CloudflareR2Provider {
    pub async fn download(_ctx: DownloadContext) -> Result<DownloadResultPayload, String> {
        Err("Provider Cloudflare R2 ainda não implementado.".to_string())
    }
}
