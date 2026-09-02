use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use super::paths::default_download_dir;

const SETTINGS_FILE: &str = "settings.json";

#[derive(Debug, Serialize, Deserialize)]
struct AppSettings {
    download_dir: Option<String>,
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(SETTINGS_FILE))
}

fn read_settings(app: &AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(app)?;
    if !path.exists() {
        return Ok(AppSettings { download_dir: None });
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn write_settings(app: &AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = settings_path(app)?;
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

pub fn resolve_download_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let settings = read_settings(app)?;
    let dir = settings
        .download_dir
        .map(PathBuf::from)
        .unwrap_or_else(default_download_dir);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

#[tauri::command]
pub fn get_default_download_dir_path() -> String {
    default_download_dir().to_string_lossy().to_string()
}

#[tauri::command]
pub fn get_download_dir(app: AppHandle) -> Result<String, String> {
    Ok(resolve_download_dir(&app)?
        .to_string_lossy()
        .to_string())
}

#[tauri::command]
pub fn set_download_dir(app: AppHandle, path: String) -> Result<String, String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("Selecione uma pasta válida.".to_string());
    }
    let dir = PathBuf::from(trimmed);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let mut settings = read_settings(&app)?;
    settings.download_dir = Some(dir.to_string_lossy().to_string());
    write_settings(&app, &settings)?;
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn pick_download_dir(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let picked = app
        .dialog()
        .file()
        .set_title("Selecionar pasta de destino")
        .blocking_pick_folder();

    match picked {
        Some(path) => {
            let value = path.to_string();
            set_download_dir(app, value.clone())?;
            Ok(Some(value))
        }
        None => Ok(None),
    }
}
