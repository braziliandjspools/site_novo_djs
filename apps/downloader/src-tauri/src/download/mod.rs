mod paths;
mod providers;
mod settings;

use tauri::AppHandle;

use paths::{build_destination_path, part_path_for};
use providers::{resolve_provider, DownloadContext, DownloadResultPayload};
use settings::{open_download_dir as open_dir, pick_download_dir as pick_dir, resolve_download_dir};

#[tauri::command]
pub fn has_download_dir_configured(app: AppHandle) -> Result<bool, String> {
    settings::has_download_dir_configured(&app)
}

#[tauri::command]
pub fn get_default_download_dir_path() -> String {
    settings::default_download_dir_path()
}

#[tauri::command]
pub fn get_download_dir(app: AppHandle) -> Result<String, String> {
    settings::get_download_dir(&app)
}

#[tauri::command]
pub fn set_download_dir(app: AppHandle, path: String) -> Result<String, String> {
    settings::set_download_dir(&app, path)
}

#[tauri::command]
pub async fn pick_download_dir(app: AppHandle) -> Result<Option<String>, String> {
    pick_dir(app).await
}

#[tauri::command]
pub fn open_download_dir(app: AppHandle) -> Result<(), String> {
    open_dir(&app)
}

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
    let final_path = build_destination_path(&base_dir, relative_path.as_deref(), &file_name)?;
    let part_path = part_path_for(&final_path);

    let ctx = DownloadContext {
        app,
        api_base_url,
        auth_token,
        file_id,
        file_name,
        final_path,
        part_path,
        job_id,
    };

    let kind = resolve_provider(&provider)?;
    kind.download(ctx).await
}
