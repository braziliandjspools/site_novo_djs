use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_autostart::ManagerExt as AutostartManagerExt;

const SETTINGS_FILE: &str = "settings.json";

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ExistingFileBehavior {
    Ignore,
    Replace,
    #[serde(alias = "rename")]
    Rename,
}

impl Default for ExistingFileBehavior {
    fn default() -> Self {
        Self::Rename
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPreferences {
    #[serde(default)]
    pub start_with_windows: bool,
    #[serde(default = "default_true")]
    pub minimize_to_tray: bool,
    #[serde(default = "default_true")]
    pub auto_download: bool,
    #[serde(default = "default_true")]
    pub show_notifications: bool,
    pub download_dir: Option<String>,
    #[serde(default = "default_max_concurrent_downloads")]
    pub max_concurrent_downloads: u8,
    #[serde(default = "default_true")]
    pub preserve_folder_structure: bool,
    #[serde(default)]
    pub existing_file_behavior: ExistingFileBehavior,
    /// Override da URL da API Next.js (ex.: http://localhost:3000)
    pub api_base_url: Option<String>,
}

fn default_true() -> bool {
    true
}

fn default_max_concurrent_downloads() -> u8 {
    3
}

impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            start_with_windows: false,
            minimize_to_tray: true,
            auto_download: true,
            show_notifications: true,
            download_dir: None,
            max_concurrent_downloads: default_max_concurrent_downloads(),
            preserve_folder_structure: true,
            existing_file_behavior: ExistingFileBehavior::Rename,
            api_base_url: None,
        }
    }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(SETTINGS_FILE))
}

pub fn read_preferences(app: &AppHandle) -> Result<AppPreferences, String> {
    let path = settings_path(app)?;
    if !path.exists() {
        return Ok(AppPreferences::default());
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn write_preferences(app: &AppHandle, prefs: &AppPreferences) -> Result<(), String> {
    let path = settings_path(app)?;
    let json = serde_json::to_string_pretty(prefs).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

pub fn sync_autostart(app: &AppHandle, enabled: bool) -> Result<(), String> {
    let autostart = app.autolaunch();
    if enabled {
        autostart.enable().map_err(|e| e.to_string())?;
    } else {
        autostart.disable().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_app_preferences(app: AppHandle) -> Result<AppPreferences, String> {
    read_preferences(&app)
}

#[tauri::command]
pub fn set_app_preferences(app: AppHandle, prefs: AppPreferences) -> Result<AppPreferences, String> {
    let mut prefs = prefs;
    prefs.max_concurrent_downloads = prefs.max_concurrent_downloads.clamp(1, 5);
    sync_autostart(&app, prefs.start_with_windows)?;
    write_preferences(&app, &prefs)?;
    Ok(prefs)
}

pub fn should_minimize_to_tray(app: &AppHandle) -> bool {
    read_preferences(app)
        .map(|prefs| prefs.minimize_to_tray)
        .unwrap_or(true)
}
