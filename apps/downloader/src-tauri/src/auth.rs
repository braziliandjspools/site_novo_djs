use std::fs;
use std::path::PathBuf;

use keyring::Entry;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

const KEYRING_SERVICE: &str = "com.brazilianpacks.downloader";
const KEYRING_SESSION_USER: &str = "portal_session";
const DEVICE_ID_FILE: &str = "device-id.json";

#[derive(Debug, Serialize, Deserialize)]
struct DeviceIdFile {
    device_id: String,
}

fn device_id_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir.join(DEVICE_ID_FILE))
}

fn read_device_id_file(path: &PathBuf) -> Option<String> {
    let content = fs::read_to_string(path).ok()?;
    let parsed = serde_json::from_str::<DeviceIdFile>(&content).ok()?;
    if parsed.device_id.len() >= 8 {
        Some(parsed.device_id)
    } else {
        None
    }
}

fn write_device_id_file(path: &PathBuf, device_id: &str) -> Result<(), String> {
    let payload = DeviceIdFile {
        device_id: device_id.to_string(),
    };
    let json = serde_json::to_string_pretty(&payload).map_err(|error| error.to_string())?;
    fs::write(path, json).map_err(|error| error.to_string())
}

fn generate_device_id() -> String {
    format!("bp-{}", Uuid::new_v4())
}

#[tauri::command]
pub fn get_or_create_device_id(app: AppHandle) -> Result<String, String> {
    let path = device_id_path(&app)?;
    if let Some(existing) = read_device_id_file(&path) {
        return Ok(existing);
    }

    let device_id = generate_device_id();
    write_device_id_file(&path, &device_id)?;
    Ok(device_id)
}

#[tauri::command]
pub fn get_device_name() -> String {
    hostname::get()
        .ok()
        .and_then(|value| value.into_string().ok())
        .map(|name| name.trim().to_string())
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| "Meu computador".to_string())
}

#[tauri::command]
pub fn get_platform_name() -> String {
    if cfg!(target_os = "windows") {
        return "windows".to_string();
    }
    if cfg!(target_os = "macos") {
        return "macos".to_string();
    }
    if cfg!(target_os = "linux") {
        return "linux".to_string();
    }
    "desktop".to_string()
}

#[tauri::command]
pub fn save_session_token(token: String) -> Result<(), String> {
    let trimmed = token.trim();
    if trimmed.is_empty() {
        return Err("Token de sessão inválido.".to_string());
    }

    let entry = Entry::new(KEYRING_SERVICE, KEYRING_SESSION_USER).map_err(|error| error.to_string())?;
    entry.set_password(trimmed).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_session_token() -> Result<Option<String>, String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_SESSION_USER).map_err(|error| error.to_string())?;
    match entry.get_password() {
        Ok(token) if !token.trim().is_empty() => Ok(Some(token)),
        Ok(_) => Ok(None),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
pub fn clear_session_token() -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_SESSION_USER).map_err(|error| error.to_string())?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}
