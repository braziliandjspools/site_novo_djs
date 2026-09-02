use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use super::paths::{suggested_download_dir, validate_download_root};

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

pub fn has_download_dir_configured(app: &AppHandle) -> Result<bool, String> {
    let settings = read_settings(app)?;
    Ok(settings.download_dir.as_ref().is_some_and(|value| !value.trim().is_empty()))
}

pub fn resolve_download_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let settings = read_settings(app)?;
    let Some(raw) = settings.download_dir else {
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
    let mut settings = read_settings(app)?;
    settings.download_dir = Some(dir.to_string_lossy().to_string());
    write_settings(app, &settings)?;
    Ok(dir.to_string_lossy().to_string())
}

pub async fn pick_download_dir(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let picked = app
        .dialog()
        .file()
        .set_title("Escolha onde suas músicas serão salvas")
        .blocking_pick_folder();

    match picked {
        Some(path) => {
            let value = path.to_string();
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
