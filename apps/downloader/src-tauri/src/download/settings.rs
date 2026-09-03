use std::path::PathBuf;

use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, FilePath};

use crate::app_prefs::{read_preferences, save_preferences, AppPreferences};

use super::paths::{suggested_download_dir, validate_download_root};

fn update_prefs<F>(app: &AppHandle, update: F) -> Result<(), String>
where
    F: FnOnce(&mut AppPreferences),
{
    let mut prefs = read_preferences(app)?;
    update(&mut prefs);
    save_preferences(app, &prefs)
}

fn file_path_to_string(path: FilePath) -> Result<String, String> {
    match path {
        FilePath::Path(path_buf) => Ok(path_buf.to_string_lossy().to_string()),
        FilePath::Url(url) => url
            .to_file_path()
            .map(|path_buf| path_buf.to_string_lossy().to_string())
            .map_err(|_| "Não foi possível converter a pasta selecionada.".to_string()),
    }
}

pub fn has_download_dir_configured(app: &AppHandle) -> Result<bool, String> {
    let prefs = read_preferences(app)?;
    Ok(prefs
        .download_dir
        .as_ref()
        .is_some_and(|value| !value.trim().is_empty()))
}

pub fn resolve_download_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let prefs = read_preferences(app)?;
    let Some(raw) = prefs.download_dir else {
        return Err("Pasta de downloads não configurada.".to_string());
    };
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err("Pasta de downloads não configurada.".to_string());
    }

    let dir = PathBuf::from(trimmed);
    validate_download_root(&dir.to_string_lossy())
}

pub fn default_download_dir_path() -> String {
    suggested_download_dir().to_string_lossy().to_string()
}

pub fn get_download_dir(app: &AppHandle) -> Result<String, String> {
    Ok(resolve_download_dir(app)?
        .to_string_lossy()
        .to_string())
}

pub fn set_download_dir(app: &AppHandle, path: String) -> Result<String, String> {
    let dir = validate_download_root(&path)?;
    let saved = dir.to_string_lossy().to_string();
    update_prefs(app, |prefs| {
        prefs.download_dir = Some(saved.clone());
    })?;
    Ok(saved)
}

pub async fn pick_download_dir(app: AppHandle) -> Result<Option<String>, String> {
    let app_handle = app.clone();
    let picked = tauri::async_runtime::spawn_blocking(move || {
        app_handle
            .dialog()
            .file()
            .set_title("Escolha onde suas músicas serão salvas")
            .blocking_pick_folder()
    })
    .await
    .map_err(|error| format!("Falha ao abrir seletor de pasta: {error}"))?;

    match picked {
        Some(path) => {
            let value = file_path_to_string(path)?;
            let saved = set_download_dir(&app, value)?;
            Ok(Some(saved))
        }
        None => Ok(None),
    }
}

pub fn open_download_dir(app: &AppHandle) -> Result<(), String> {
    let dir = resolve_download_dir(app)?;

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&dir)
            .spawn()
            .map_err(|e| format!("Não foi possível abrir a pasta: {e}"))?;
        return Ok(());
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = dir;
        Err("Abrir pasta disponível apenas no Windows.".to_string())
    }
}

pub fn get_max_concurrent_downloads(app: &AppHandle) -> Result<u8, String> {
    Ok(read_preferences(app)?.max_concurrent_downloads)
}

pub fn set_max_concurrent_downloads(app: &AppHandle, value: u8) -> Result<u8, String> {
    let clamped = value.clamp(1, 5);
    update_prefs(app, |prefs| {
        prefs.max_concurrent_downloads = clamped;
    })?;
    Ok(clamped)
}
