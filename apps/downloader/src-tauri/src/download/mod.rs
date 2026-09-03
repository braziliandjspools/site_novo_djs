mod paths;
mod providers;
mod settings;
mod cancel;

use tauri::AppHandle;

use crate::app_prefs::{read_preferences, ExistingFileBehavior};

use paths::{part_path_for, resolve_destination_path};
use providers::{resolve_provider, DownloadContext, DownloadResultPayload};
use providers::cleanup_part_file;
use settings::resolve_download_dir;
use cancel::{
    cancel as cancel_token, part_path_for as registered_part_path, register as register_cancel_token,
    unregister as unregister_cancel_token,
};

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
    settings::pick_download_dir(app).await
}

#[tauri::command]
pub fn open_download_dir(app: AppHandle) -> Result<(), String> {
    settings::open_download_dir(&app)
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
    let prefs = read_preferences(&app)?;
    let base_dir = resolve_download_dir(&app)?;
    let resolved = resolve_destination_path(
        &base_dir,
        relative_path.as_deref(),
        &file_name,
        prefs.preserve_folder_structure,
        prefs.existing_file_behavior,
    )?;

    if resolved.skipped {
        return Ok(DownloadResultPayload {
            path: resolved.final_path.to_string_lossy().to_string(),
            downloaded_bytes: 0,
            total_bytes: None,
            skipped: true,
        });
    }

    let final_path = resolved.final_path;
    let part_path = part_path_for(&final_path);
    let replace_existing = prefs.existing_file_behavior == ExistingFileBehavior::Replace;

    let cancel_token = register_cancel_token(job_id, part_path.clone());

    let ctx = DownloadContext {
        app,
        api_base_url,
        auth_token,
        file_id,
        file_name,
        final_path: final_path.clone(),
        part_path: part_path.clone(),
        job_id,
        cancel_token,
        replace_existing,
    };

    let kind = resolve_provider(&provider)?;
    let result = kind.download(ctx).await;
    unregister_cancel_token(job_id);

    result
}

#[tauri::command]
pub async fn cancel_download_job(
    app: AppHandle,
    job_id: u32,
    file_name: String,
    relative_path: Option<String>,
    delete_part: bool,
) -> Result<(), String> {
    cancel_token(job_id);

    if delete_part {
        if let Some(part_path) = registered_part_path(job_id) {
            cleanup_part_file(&part_path).await;
        } else {
            let prefs = read_preferences(&app)?;
            let base_dir = resolve_download_dir(&app)?;
            let resolved = resolve_destination_path(
                &base_dir,
                relative_path.as_deref(),
                &file_name,
                prefs.preserve_folder_structure,
                prefs.existing_file_behavior,
            )?;
            if !resolved.skipped {
                cleanup_part_file(&part_path_for(&resolved.final_path)).await;
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_max_concurrent_downloads(app: AppHandle) -> Result<u8, String> {
    settings::get_max_concurrent_downloads(&app)
}

#[tauri::command]
pub fn set_max_concurrent_downloads(app: AppHandle, value: u8) -> Result<u8, String> {
    settings::set_max_concurrent_downloads(&app, value)
}
