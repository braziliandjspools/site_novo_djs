mod paths;
mod providers;
mod settings;

use tauri::AppHandle;

use paths::build_destination_path;
use providers::{resolve_provider, DownloadContext, DownloadResultPayload};
use settings::resolve_download_dir;

pub use settings::{get_default_download_dir_path, get_download_dir, pick_download_dir, set_download_dir};

#[tauri::command]
pub async fn download_job_file(
    app: AppHandle,
    api_base_url: String,
    provider: String,
    file_id: String,
    file_name: String,
    relative_path: Option<String>,
    auth_token: String,
    job_id: u32,
) -> Result<DownloadResultPayload, String> {
    let base_dir = resolve_download_dir(&app)?;
    let dest_path = build_destination_path(&base_dir, relative_path.as_deref(), &file_name)?;

    let ctx = DownloadContext {
        app,
        api_base_url,
        auth_token,
        file_id,
        file_name,
        dest_path,
        job_id,
    };

    let kind = resolve_provider(&provider)?;
    kind.download(ctx).await
}
