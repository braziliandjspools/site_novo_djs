use std::fs;
use std::path::PathBuf;

use keyring::Entry;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

const KEYRING_SERVICE: &str = "com.brazilianpacks.downloader";
const KEYRING_SESSION_USER: &str = "portal_session";
const DEVICE_ID_FILE: &str = "device-id.json";
const SESSION_FILE: &str = "session-token.json";

#[derive(Debug, Serialize, Deserialize)]
struct DeviceIdFile {
    device_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct SessionFile {
    token: String,
}

fn config_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

fn device_id_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(config_dir(app)?.join(DEVICE_ID_FILE))
}

fn session_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(config_dir(app)?.join(SESSION_FILE))
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

fn write_session_file(path: &PathBuf, token: &str) -> Result<(), String> {
    let payload = SessionFile {
        token: token.to_string(),
    };
    let json = serde_json::to_string_pretty(&payload).map_err(|error| error.to_string())?;
    fs::write(path, json).map_err(|error| error.to_string())
}

fn read_session_file(path: &PathBuf) -> Result<Option<String>, String> {
    let content = match fs::read_to_string(path) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };

    let parsed = serde_json::from_str::<SessionFile>(&content).map_err(|error| error.to_string())?;
    if parsed.token.trim().is_empty() {
        Ok(None)
    } else {
        Ok(Some(parsed.token))
    }
}

fn clear_session_file(path: &PathBuf) -> Result<(), String> {
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

fn load_keyring_token() -> Option<String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_SESSION_USER).ok()?;
    match entry.get_password() {
        Ok(token) if !token.trim().is_empty() => Some(token),
        // Sem entrada ou vazio: não tem token no keyring.
        Ok(_) | Err(keyring::Error::NoEntry) => None,
        // Erros transitórios (Credential Manager após reboot) → None,
        // o caller ainda tenta o arquivo de fallback.
        Err(_) => None,
    }
}

fn save_keyring_token(token: &str) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_SESSION_USER).map_err(|error| error.to_string())?;
    entry.set_password(token).map_err(|error| error.to_string())
}

fn clear_keyring_token() -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_SESSION_USER).map_err(|error| error.to_string())?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
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

/// Dual-write: keyring + arquivo. O arquivo cobre reboot quando o Credential Manager falha.
#[tauri::command]
pub fn save_session_token(app: AppHandle, token: String) -> Result<(), String> {
    let trimmed = token.trim();
    if trimmed.is_empty() {
        return Err("Token de sessão inválido.".to_string());
    }

    let path = session_file_path(&app)?;
    let file_ok = write_session_file(&path, trimmed);
    let keyring_ok = save_keyring_token(trimmed);

    if file_ok.is_ok() || keyring_ok.is_ok() {
        return Ok(());
    }

    Err(format!(
        "Não foi possível salvar a sessão. keyring: {}; arquivo: {}",
        keyring_ok.err().unwrap_or_default(),
        file_ok.err().unwrap_or_default()
    ))
}

#[tauri::command]
pub fn load_session_token(app: AppHandle) -> Result<Option<String>, String> {
    if let Some(token) = load_keyring_token() {
        // Repara o fallback em arquivo se o keyring ainda tiver o token.
        let path = session_file_path(&app)?;
        if read_session_file(&path)?.is_none() {
            let _ = write_session_file(&path, &token);
        }
        return Ok(Some(token));
    }

    read_session_file(&session_file_path(&app)?)
}

#[tauri::command]
pub fn clear_session_token(app: AppHandle) -> Result<(), String> {
    let _ = clear_keyring_token();
    clear_session_file(&session_file_path(&app)?)
}
