use std::collections::HashMap;
use std::fs;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogResult};

use crate::app_prefs::ExistingFileBehavior;

const INDEX_FILE: &str = ".brs-download-index.json";
const QUICK_HASH_MAX_BYTES: u64 = 5 * 1024 * 1024;
const SAMPLE_BYTES: u64 = 64 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DuplicateAnalysis {
    NotExists,
    ProvablySame,
    Conflict,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct IndexEntry {
    file_id: String,
    file_name: String,
    relative_path: Option<String>,
    size: u64,
    path: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    fingerprint: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DownloadIndex {
    #[serde(default = "default_index_version")]
    version: u8,
    #[serde(default)]
    entries: HashMap<String, IndexEntry>,
}

fn default_index_version() -> u8 {
    1
}

fn index_path(base_dir: &Path) -> PathBuf {
    base_dir.join(INDEX_FILE)
}

pub fn load_index(base_dir: &Path) -> DownloadIndex {
    let path = index_path(base_dir);
    if !path.exists() {
        return DownloadIndex::default();
    }

    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default()
}

fn save_index(base_dir: &Path, index: &DownloadIndex) -> Result<(), String> {
    let path = index_path(base_dir);
    let json = serde_json::to_string_pretty(index).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| format!("Não foi possível salvar índice local: {e}"))
}

fn normalize_path(path: &Path) -> String {
    path.to_string_lossy().replace('/', "\\").to_ascii_lowercase()
}

fn paths_equivalent(left: &Path, right: &Path) -> bool {
    normalize_path(left) == normalize_path(right)
}

fn entry_resolved_path(base_dir: &Path, entry: &IndexEntry) -> PathBuf {
    let stored = PathBuf::from(&entry.path);
    if stored.is_absolute() {
        stored
    } else {
        base_dir.join(stored)
    }
}

pub fn file_fingerprint(path: &Path, size: u64) -> Result<u64, String> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut file = fs::File::open(path).map_err(|e| format!("Não foi possível ler arquivo: {e}"))?;
    let mut hasher = DefaultHasher::new();
    size.hash(&mut hasher);

    if size == 0 {
        return Ok(hasher.finish());
    }

    if size <= QUICK_HASH_MAX_BYTES {
        let mut buffer = Vec::with_capacity(size as usize);
        file.read_to_end(&mut buffer)
            .map_err(|e| format!("Não foi possível ler arquivo: {e}"))?;
        buffer.hash(&mut hasher);
        return Ok(hasher.finish());
    }

    let mut head = vec![0u8; SAMPLE_BYTES as usize];
    let head_read = file
        .read(&mut head)
        .map_err(|e| format!("Não foi possível ler arquivo: {e}"))?;
    head.truncate(head_read);
    head.hash(&mut hasher);

    let tail_start = size.saturating_sub(SAMPLE_BYTES);
    file.seek(SeekFrom::Start(tail_start))
        .map_err(|e| format!("Não foi possível ler arquivo: {e}"))?;
    let mut tail = vec![0u8; SAMPLE_BYTES as usize];
    let tail_read = file
        .read(&mut tail)
        .map_err(|e| format!("Não foi possível ler arquivo: {e}"))?;
    tail.truncate(tail_read);
    tail.hash(&mut hasher);

    Ok(hasher.finish())
}

pub fn analyze_duplicate(
    base_dir: &Path,
    file_id: &str,
    candidate_path: &Path,
    expected_size: Option<u64>,
) -> DuplicateAnalysis {
    if !candidate_path.exists() {
        return DuplicateAnalysis::NotExists;
    }

    let existing_size = fs::metadata(candidate_path).ok().map(|meta| meta.len());
    let index = load_index(base_dir);

    if let Some(entry) = index.entries.get(file_id) {
        let indexed_path = entry_resolved_path(base_dir, entry);
        let indexed_exists = indexed_path.exists();
        let indexed_size = indexed_path
            .exists()
            .then(|| fs::metadata(&indexed_path).ok().map(|meta| meta.len()))
            .flatten();

        let size_matches = match (existing_size, expected_size, indexed_size) {
            (Some(existing), Some(expected), _) if existing == expected && expected > 0 => true,
            (Some(existing), None, Some(indexed)) if existing == indexed && indexed > 0 => true,
            (Some(existing), _, _) if existing == entry.size && entry.size > 0 => true,
            _ => false,
        };

        if size_matches {
            if paths_equivalent(&indexed_path, candidate_path)
                || (indexed_exists && indexed_size == Some(entry.size))
            {
                if let (Some(stored_fp), Some(existing)) = (entry.fingerprint, existing_size) {
                    if entry.size == existing {
                        if let Ok(current_fp) = file_fingerprint(candidate_path, existing) {
                            if stored_fp == current_fp {
                                return DuplicateAnalysis::ProvablySame;
                            }
                        }
                    }
                } else if entry.size > 0 && existing_size == Some(entry.size) {
                    return DuplicateAnalysis::ProvablySame;
                }
            }
        }
    }

    if let (Some(expected), Some(existing)) = (expected_size, existing_size) {
        if expected > 0 && expected == existing {
            if expected <= QUICK_HASH_MAX_BYTES {
                if let Ok(current_fp) = file_fingerprint(candidate_path, existing) {
                    if let Some(entry) = index.entries.get(file_id) {
                        if entry.fingerprint == Some(current_fp) {
                            return DuplicateAnalysis::ProvablySame;
                        }
                    }
                }
            }
        }
    }

    DuplicateAnalysis::Conflict
}

pub fn prompt_duplicate_action(app: &AppHandle, file_name: &str) -> ExistingFileBehavior {
    let result = app
        .dialog()
        .message(format!(
            "\"{file_name}\" já existe na pasta de destino.\n\nSubstituir, renomear ou ignorar?"
        ))
        .title("Arquivo duplicado")
        .buttons(MessageDialogButtons::YesNoCancelCustom(
            "Substituir".into(),
            "Renomear".into(),
            "Ignorar".into(),
        ))
        .blocking_show_with_result();

    match result {
        MessageDialogResult::Yes => ExistingFileBehavior::Replace,
        MessageDialogResult::No => ExistingFileBehavior::Rename,
        _ => ExistingFileBehavior::Ignore,
    }
}

pub async fn resolve_duplicate_behavior(
    app: &AppHandle,
    file_name: &str,
    configured: ExistingFileBehavior,
) -> ExistingFileBehavior {
    if configured != ExistingFileBehavior::Ask {
        return configured;
    }

    let app = app.clone();
    let file_name = file_name.to_string();
    tauri::async_runtime::spawn_blocking(move || prompt_duplicate_action(&app, &file_name))
        .await
        .unwrap_or(ExistingFileBehavior::Ignore)
}

pub fn register_completed_download(
    base_dir: &Path,
    file_id: &str,
    file_name: &str,
    relative_path: Option<&str>,
    final_path: &Path,
    size: u64,
) -> Result<(), String> {
    let mut index = load_index(base_dir);
    let fingerprint = if size > 0 {
        file_fingerprint(final_path, size).ok()
    } else {
        None
    };

    index.entries.insert(
        file_id.to_string(),
        IndexEntry {
            file_id: file_id.to_string(),
            file_name: file_name.to_string(),
            relative_path: relative_path.map(str::to_string),
            size,
            path: final_path.to_string_lossy().to_string(),
            fingerprint,
        },
    );

    save_index(base_dir, &index)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn temp_base(name: &str) -> PathBuf {
        env::temp_dir().join(format!("bp-dup-test-{name}-{}", std::process::id()))
    }

    fn reset_base(base: &Path) {
        let _ = fs::remove_dir_all(base);
        fs::create_dir_all(base).unwrap();
    }

    #[test]
    fn not_exists_returns_not_exists() {
        let base = temp_base("missing");
        reset_base(&base);
        let candidate = base.join("musica.mp3");
        assert_eq!(
            analyze_duplicate(&base, "file-1", &candidate, Some(100)),
            DuplicateAnalysis::NotExists
        );
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn same_file_id_and_size_is_provably_same() {
        let base = temp_base("same-id");
        reset_base(&base);
        let candidate = base.join("musica.mp3");
        fs::write(&candidate, vec![1u8; 128]).unwrap();

        register_completed_download(&base, "drive-abc", "musica.mp3", None, &candidate, 128).unwrap();

        assert_eq!(
            analyze_duplicate(&base, "drive-abc", &candidate, Some(128)),
            DuplicateAnalysis::ProvablySame
        );
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn same_name_different_size_is_conflict() {
        let base = temp_base("diff-size");
        reset_base(&base);
        let candidate = base.join("musica.mp3");
        fs::write(&candidate, vec![1u8; 64]).unwrap();

        register_completed_download(&base, "drive-abc", "musica.mp3", None, &candidate, 64).unwrap();

        assert_eq!(
            analyze_duplicate(&base, "drive-other", &candidate, Some(128)),
            DuplicateAnalysis::Conflict
        );
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn identical_small_file_without_index_entry_uses_fingerprint() {
        let base = temp_base("fingerprint");
        reset_base(&base);
        let candidate = base.join("musica.mp3");
        let bytes = vec![7u8; 256];
        fs::write(&candidate, &bytes).unwrap();

        let fp = file_fingerprint(&candidate, 256).unwrap();
        let mut index = DownloadIndex::default();
        index.entries.insert(
            "drive-fp".into(),
            IndexEntry {
                file_id: "drive-fp".into(),
                file_name: "musica.mp3".into(),
                relative_path: None,
                size: 256,
                path: candidate.to_string_lossy().to_string(),
                fingerprint: Some(fp),
            },
        );
        save_index(&base, &index).unwrap();

        assert_eq!(
            analyze_duplicate(&base, "drive-fp", &candidate, Some(256)),
            DuplicateAnalysis::ProvablySame
        );
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn register_and_reload_index_roundtrip() {
        let base = temp_base("roundtrip");
        reset_base(&base);
        let file = base.join("track.mp3");
        fs::write(&file, b"abc").unwrap();
        register_completed_download(&base, "id-1", "track.mp3", Some("Funk"), &file, 3).unwrap();
        let index = load_index(&base);
        assert!(index.entries.contains_key("id-1"));
        let _ = fs::remove_dir_all(&base);
    }
}
