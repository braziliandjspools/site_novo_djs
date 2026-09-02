use super::{DownloadContext, DownloadResultPayload};

/// Placeholder — implementar quando arquivos migrarem para S3.
pub struct S3Provider;

impl S3Provider {
    pub async fn download(_ctx: DownloadContext) -> Result<DownloadResultPayload, String> {
        Err("Provider S3 ainda não implementado.".to_string())
    }
}
