mod paths;
mod providers;
mod settings;
mod cancel;
mod duplicates;
mod disk_space;
pub mod speed_limit;

use std::sync::Arc;

use tauri::{AppHandle, Manager, State};

use crate::app_prefs::{read_preferences, ExistingFileBehavior};

use duplicates::{analyze_duplicate, register_completed_download, resolve_duplicate_behavior, DuplicateAnalysis};
use paths::{part_path_for, resolve_destination_path};
use providers::{resolve_provider, DownloadContext, DownloadResultPayload};
use providers::cleanup_part_file;
use settings::resolve_download_dir;
use disk_space::DiskSpaceInfo;
use speed_limit::GlobalSpeedLimiter;
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
pub fn get_download_disk_space(app: AppHandle) -> Result<DiskSpaceInfo, String> {
    let base_dir = resolve_download_dir(&app)?;
    disk_space::query_disk_space(&base_dir)
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
    file_size: Option<u64>,
) -> Result<DownloadResultPayload, String> {
    let prefs = read_preferences(&app)?;
    let base_dir = resolve_download_dir(&app)?;
    let effective_relative = if prefs.preserve_folder_structure {
        relative_path.as_deref()
    } else {
        None
    };

    let candidate = paths::build_destination_path(&base_dir, effective_relative, &file_name)?;

    let analysis = analyze_duplicate(&base_dir, &file_id, &candidate, file_size);
    if analysis == DuplicateAnalysis::ProvablySame {
        return Ok(DownloadResultPayload {
            path: candidate.to_string_lossy().to_string(),
            downloaded_bytes: 0,
            total_bytes: file_size,
            skipped: true,
        });
    }

    let behavior = if analysis == DuplicateAnalysis::Conflict {
        resolve_duplicate_behavior(&app, &file_name, prefs.existing_file_behavior).await
    } else {
        prefs.existing_file_behavior
    };

    let resolved = resolve_destination_path(
        &base_dir,
        effective_relative,
        &file_name,
        behavior,
    )?;

    if resolved.skipped {
        return Ok(DownloadResultPayload {
            path: resolved.final_path.to_string_lossy().to_string(),
            downloaded_bytes: 0,
            total_bytes: file_size,
            skipped: true,
        });
    }

    let final_path = resolved.final_path;
    let part_path = part_path_for(&final_path);
    let replace_existing = behavior == ExistingFileBehavior::Replace;

    let cancel_token = register_cancel_token(job_id, part_path.clone());

    let speed_limiter = app
        .try_state::<Arc<GlobalSpeedLimiter>>()
        .map(|state| state.inner().clone())
        .unwrap_or_else(|| Arc::new(GlobalSpeedLimiter::new(0)));

    let ctx = DownloadContext {
        app: app.clone(),
        api_base_url,
        auth_token,
        file_id: file_id.clone(),
        file_name: file_name.clone(),
        final_path: final_path.clone(),
        part_path: part_path.clone(),
        job_id,
        expected_total: file_size,
        cancel_token,
        replace_existing,
        speed_limiter,
    };

    let kind = resolve_provider(&provider)?;
    let result = kind.download(ctx).await;
    unregister_cancel_token(job_id);

    if let Ok(ref payload) = result {
        if !payload.skipped && payload.downloaded_bytes > 0 {
            let size = payload.total_bytes.unwrap_or(payload.downloaded_bytes);
            let _ = register_completed_download(
                &base_dir,
                &file_id,
                &file_name,
                effective_relative,
                &final_path,
                size,
            );
        }
    }

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
                if prefs.preserve_folder_structure {
                    relative_path.as_deref()
                } else {
                    None
                },
                &file_name,
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

#[tauri::command]
pub fn get_download_speed_limit_bps(limiter: State<'_, Arc<GlobalSpeedLimiter>>) -> u64 {
    limiter.limit_bps()
}

#[tauri::command]
pub fn set_download_speed_limit_bps(
    app: AppHandle,
    limiter: State<'_, Arc<GlobalSpeedLimiter>>,
    bytes_per_second: u64,
) -> Result<u64, String> {
    let mut prefs = read_preferences(&app)?;
    crate::app_prefs::apply_speed_limit_bps(&mut prefs, bytes_per_second);
    crate::app_prefs::save_preferences(&app, &prefs)?;
    limiter.set_limit_bps(prefs.resolved_speed_limit_bps());
    Ok(limiter.limit_bps())
}
