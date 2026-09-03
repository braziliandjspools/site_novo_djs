use std::fs;
use std::path::PathBuf;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_autostart::ManagerExt as AutostartManagerExt;

use crate::download::speed_limit::GlobalSpeedLimiter;

const SETTINGS_FILE: &str = "settings.json";
const MB: u64 = 1024 * 1024;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ExistingFileBehavior {
    Ignore,
    Ask,
    Replace,
    #[serde(alias = "rename")]
    Rename,
}

impl Default for ExistingFileBehavior {
    fn default() -> Self {
        Self::Ignore
    }
}

/// Preset de limite de velocidade (MB/s). `custom` usa `speed_limit_custom_mbps`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum SpeedLimitMode {
    #[serde(alias = "unlimited", alias = "none")]
    Unlimited,
    #[serde(rename = "1")]
    Mb1,
    #[serde(rename = "2")]
    Mb2,
    #[serde(rename = "5")]
    Mb5,
    #[serde(rename = "10")]
    Mb10,
    #[serde(rename = "20")]
    Mb20,
    Custom,
}

impl Default for SpeedLimitMode {
    fn default() -> Self {
        Self::Unlimited
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
    #[serde(default)]
    pub speed_limit_mode: SpeedLimitMode,
    /// Valor em MB/s quando `speed_limit_mode` = Custom.
    #[serde(default = "default_custom_mbps")]
    pub speed_limit_custom_mbps: f64,
    #[serde(default)]
    pub schedule_enabled: bool,
    #[serde(default = "default_schedule_start")]
    pub schedule_start: String,
    #[serde(default = "default_schedule_end")]
    pub schedule_end: String,
    #[serde(default = "default_true")]
    pub schedule_allow_manual_override: bool,
    /// Após concluir os downloads de um pack/pasta, criar um ZIP (opcional).
    #[serde(default)]
    pub zip_compress_downloads: bool,
    /// Verificar novas versões publicadas no site e avisar no sininho.
    #[serde(default = "default_true")]
    pub check_app_updates: bool,
}

fn default_true() -> bool {
    true
}

fn default_max_concurrent_downloads() -> u8 {
    3
}

fn default_custom_mbps() -> f64 {
    3.0
}

fn default_schedule_start() -> String {
    "00:00".to_string()
}

fn default_schedule_end() -> String {
    "07:00".to_string()
}

fn normalize_hhmm(value: &str, fallback: &str) -> String {
    let trimmed = value.trim();
    let parts: Vec<&str> = trimmed.split(':').collect();
    if parts.len() != 2 {
        return fallback.to_string();
    }
    let Ok(hours) = parts[0].parse::<u32>() else {
        return fallback.to_string();
    };
    let Ok(minutes) = parts[1].parse::<u32>() else {
        return fallback.to_string();
    };
    if hours > 23 || minutes > 59 {
        return fallback.to_string();
    }
    format!("{hours:02}:{minutes:02}")
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
            existing_file_behavior: ExistingFileBehavior::Ignore,
            api_base_url: None,
            speed_limit_mode: SpeedLimitMode::Unlimited,
            speed_limit_custom_mbps: default_custom_mbps(),
            schedule_enabled: false,
            schedule_start: default_schedule_start(),
            schedule_end: default_schedule_end(),
            schedule_allow_manual_override: true,
            zip_compress_downloads: false,
            check_app_updates: true,
        }
    }
}

impl AppPreferences {
    pub fn resolved_speed_limit_bps(&self) -> u64 {
        match self.speed_limit_mode {
            SpeedLimitMode::Unlimited => 0,
            SpeedLimitMode::Mb1 => MB,
            SpeedLimitMode::Mb2 => 2 * MB,
            SpeedLimitMode::Mb5 => 5 * MB,
            SpeedLimitMode::Mb10 => 10 * MB,
            SpeedLimitMode::Mb20 => 20 * MB,
            SpeedLimitMode::Custom => {
                let mbps = self.speed_limit_custom_mbps;
                if !mbps.is_finite() || mbps <= 0.0 {
                    0
                } else {
                    (mbps * MB as f64).round() as u64
                }
            }
        }
    }

    pub fn normalize_speed_limit(&mut self) {
        if self.speed_limit_custom_mbps.is_nan() || self.speed_limit_custom_mbps.is_infinite() {
            self.speed_limit_custom_mbps = default_custom_mbps();
        }
        self.speed_limit_custom_mbps = self.speed_limit_custom_mbps.clamp(0.1, 1000.0);
        self.schedule_start = normalize_hhmm(&self.schedule_start, "00:00");
        self.schedule_end = normalize_hhmm(&self.schedule_end, "07:00");
    }
}

/// Atualiza mode/custom a partir de um valor bruto em bytes/s (0 = sem limite).
pub fn apply_speed_limit_bps(prefs: &mut AppPreferences, bytes_per_second: u64) {
    if bytes_per_second == 0 {
        prefs.speed_limit_mode = SpeedLimitMode::Unlimited;
        return;
    }

    let mbps = bytes_per_second as f64 / MB as f64;
    let nearest = mbps.round() as u64;
    prefs.speed_limit_mode = match nearest {
        1 if (mbps - 1.0).abs() < 0.05 => SpeedLimitMode::Mb1,
        2 if (mbps - 2.0).abs() < 0.05 => SpeedLimitMode::Mb2,
        5 if (mbps - 5.0).abs() < 0.05 => SpeedLimitMode::Mb5,
        10 if (mbps - 10.0).abs() < 0.05 => SpeedLimitMode::Mb10,
        20 if (mbps - 20.0).abs() < 0.05 => SpeedLimitMode::Mb20,
        _ => {
            prefs.speed_limit_custom_mbps = mbps.clamp(0.1, 1000.0);
            SpeedLimitMode::Custom
        }
    };
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

/// Persiste preferências sem tocar no autostart (ex.: pasta de downloads).
pub fn save_preferences(app: &AppHandle, prefs: &AppPreferences) -> Result<(), String> {
    write_preferences(app, prefs)
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

pub fn sync_speed_limiter(app: &AppHandle, prefs: &AppPreferences) {
    if let Some(limiter) = app.try_state::<Arc<GlobalSpeedLimiter>>() {
        limiter.set_limit_bps(prefs.resolved_speed_limit_bps());
    }
}

#[tauri::command]
pub fn get_app_preferences(app: AppHandle) -> Result<AppPreferences, String> {
    read_preferences(&app)
}

#[tauri::command]
pub fn set_app_preferences(
    app: AppHandle,
    prefs: AppPreferences,
    limiter: State<'_, Arc<GlobalSpeedLimiter>>,
) -> Result<AppPreferences, String> {
    let mut prefs = prefs;
    prefs.max_concurrent_downloads = prefs.max_concurrent_downloads.clamp(1, 5);
    prefs.normalize_speed_limit();
    sync_autostart(&app, prefs.start_with_windows)?;
    write_preferences(&app, &prefs)?;
    limiter.set_limit_bps(prefs.resolved_speed_limit_bps());
    Ok(prefs)
}

pub fn should_minimize_to_tray(app: &AppHandle) -> bool {
    read_preferences(app)
        .map(|prefs| prefs.minimize_to_tray)
        .unwrap_or(true)
}
