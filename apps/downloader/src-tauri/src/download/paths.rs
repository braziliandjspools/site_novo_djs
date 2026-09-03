use std::fs;
use std::path::{Component, Path, PathBuf};

use crate::app_prefs::ExistingFileBehavior;

const PART_SUFFIX: &str = ".part";
const MAX_SEGMENT_LEN: usize = 200;
const MAX_RELATIVE_DEPTH: usize = 32;

const WINDOWS_RESERVED: &[&str] = &[
    "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8",
    "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

/// Pasta sugerida na primeira configuração (não usada automaticamente para download).
pub fn suggested_download_dir() -> PathBuf {
    if let Ok(user_profile) = std::env::var("USERPROFILE") {
        return PathBuf::from(user_profile)
            .join("Music")
            .join("Brazilian Remix Service");
    }
    if let Some(home) = dirs::home_dir() {
        return home.join("Music").join("Brazilian Remix Service");
    }
    PathBuf::from("Brazilian Remix Service")
}

pub fn part_path_for(final_path: &Path) -> PathBuf {
    let mut value = final_path.to_string_lossy().into_owned();
    if value.ends_with(PART_SUFFIX) {
        return final_path.to_path_buf();
    }
    value.push_str(PART_SUFFIX);
    PathBuf::from(value)
}

fn is_windows_reserved(name: &str) -> bool {
    let upper = name.trim_end_matches('.').trim_end_matches(' ').to_ascii_uppercase();
    WINDOWS_RESERVED.contains(&upper.as_str())
}

fn sanitize_segment(segment: &str) -> Option<String> {
    let trimmed = segment.trim().trim_end_matches('.').trim_end_matches(' ');
    if trimmed.is_empty() || trimmed == "." || trimmed == ".." {
        return None;
    }
    if trimmed.contains("..") {
        return None;
    }

    let mut clean = String::new();
    for ch in trimmed.chars() {
        if matches!(ch, '<' | '>' | ':' | '"' | '|' | '?' | '*' | '\0') {
            continue;
        }
        if ch == '/' || ch == '\\' {
            return None;
        }
        clean.push(ch);
    }

    if clean.is_empty() || clean.len() > MAX_SEGMENT_LEN || is_windows_reserved(&clean) {
        return None;
    }

    Some(clean)
}

fn sanitize_file_name(file_name: &str) -> Option<String> {
    if file_name.contains("..") || file_name.contains('/') || file_name.contains('\\') {
        return None;
    }

    let base = Path::new(file_name)
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or(file_name);
    let without_part = base.strip_suffix(PART_SUFFIX).unwrap_or(base);
    sanitize_segment(without_part)
}

fn sanitize_relative_path(relative_path: Option<&str>) -> Result<Vec<String>, String> {
    let Some(raw) = relative_path else {
        return Ok(Vec::new());
    };

    if raw.contains("..") {
        return Err("Caminho relativo inválido.".to_string());
    }

    let mut parts = Vec::new();
    for segment in Path::new(raw).components() {
        match segment {
            Component::Normal(value) => {
                let clean = sanitize_segment(&value.to_string_lossy())
                    .ok_or_else(|| "Nome de pasta inválido.".to_string())?;
                parts.push(clean);
                if parts.len() > MAX_RELATIVE_DEPTH {
                    return Err("Caminho relativo muito profundo.".to_string());
                }
            }
            Component::RootDir | Component::Prefix(_) => {
                return Err("Caminho relativo não pode ser absoluto.".to_string());
            }
            Component::ParentDir => return Err("Caminho relativo inválido.".to_string()),
            Component::CurDir => {}
        }
    }

    Ok(parts)
}

fn canonical_base(base_dir: &Path) -> Result<PathBuf, String> {
    fs::create_dir_all(base_dir).map_err(|e| format!("Não foi possível acessar a pasta base: {e}"))?;
    base_dir
        .canonicalize()
        .map_err(|e| format!("Não foi possível resolver a pasta base: {e}"))
}

fn ensure_within_base(base: &Path, candidate: &Path) -> Result<(), String> {
    let resolved = candidate
        .canonicalize()
        .map_err(|e| format!("Destino inválido: {e}"))?;
    if !resolved.starts_with(base) {
        return Err("Caminho de destino fora da pasta configurada.".to_string());
    }
    Ok(())
}

pub fn build_destination_path(
    base_dir: &Path,
    relative_path: Option<&str>,
    file_name: &str,
) -> Result<PathBuf, String> {
    let file_segment =
        sanitize_file_name(file_name).ok_or_else(|| "Nome de arquivo inválido.".to_string())?;
    let relative_parts = sanitize_relative_path(relative_path)?;

    let base = canonical_base(base_dir)?;

    let mut dest = base.clone();
    for part in relative_parts {
        dest.push(part);
    }
    dest.push(&file_segment);

    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Não foi possível criar pastas: {e}"))?;
        ensure_within_base(&base, parent)?;
    }

    Ok(dest)
}

pub struct ResolvedDestination {
    pub final_path: PathBuf,
    pub skipped: bool,
}

pub fn resolve_destination_path(
    base_dir: &Path,
    relative_path: Option<&str>,
    file_name: &str,
    existing_file_behavior: ExistingFileBehavior,
) -> Result<ResolvedDestination, String> {
    let final_path = build_destination_path(base_dir, relative_path, file_name)?;

    if !final_path.exists() {
        return Ok(ResolvedDestination {
            final_path,
            skipped: false,
        });
    }

    match existing_file_behavior {
        ExistingFileBehavior::Ignore | ExistingFileBehavior::Ask => Ok(ResolvedDestination {
            final_path,
            skipped: true,
        }),
        ExistingFileBehavior::Replace => Ok(ResolvedDestination {
            final_path,
            skipped: false,
        }),
        ExistingFileBehavior::Rename => Ok(ResolvedDestination {
            final_path: find_unique_path(&final_path)?,
            skipped: false,
        }),
    }
}

fn find_unique_path(path: &Path) -> Result<PathBuf, String> {
    let parent = path
        .parent()
        .ok_or_else(|| "Destino inválido.".to_string())?;
    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "Nome de arquivo inválido.".to_string())?;

    let (stem, extension) = split_file_name(file_name);

    for index in 1..=9999 {
        let candidate_name = if extension.is_empty() {
            format!("{stem} ({index})")
        } else {
            format!("{stem} ({index}).{extension}")
        };

        let candidate = parent.join(&candidate_name);
        if !candidate.exists() {
            return Ok(candidate);
        }
    }

    Err("Não foi possível gerar um nome único para o arquivo.".to_string())
}

fn split_file_name(file_name: &str) -> (&str, &str) {
    match file_name.rsplit_once('.') {
        Some((stem, ext)) if !stem.is_empty() && !ext.is_empty() && !ext.contains('\\') => (stem, ext),
        _ => (file_name, ""),
    }
}

pub fn validate_download_root(path: &str) -> Result<PathBuf, String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("Selecione uma pasta válida.".to_string());
    }
    if trimmed.contains("..") {
        return Err("Caminho inválido.".to_string());
    }

    let dir = PathBuf::from(trimmed);
    if !dir.is_absolute() {
        return Err("Selecione um caminho absoluto (ex.: D:\\Brazilian Remix Service).".to_string());
    }

    fs::create_dir_all(&dir).map_err(|e| format!("Sem permissão para usar esta pasta: {e}"))?;

    let probe = dir.join(".bp-write-test");
    fs::write(&probe, b"ok").map_err(|e| format!("Sem permissão de escrita nesta pasta: {e}"))?;
    let _ = fs::remove_file(probe);

    dir.canonicalize().or(Ok(dir))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn temp_base(name: &str) -> PathBuf {
        env::temp_dir().join(format!("bp-path-test-{name}-{}", std::process::id()))
    }

    #[test]
    fn rejects_parent_dir_in_relative_path() {
        let base = temp_base("traversal");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let result = build_destination_path(&base, Some("../secret"), "musica.mp3");
        assert!(result.is_err());
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn rejects_dot_dot_in_file_name() {
        let base = temp_base("filename");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let result = build_destination_path(&base, Some("Fevereiro/Funk"), "..\\bad.mp3");
        assert!(result.is_err());
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn accepts_nested_relative_path() {
        let base = temp_base("nested");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let dest = build_destination_path(&base, Some("Março/Sertanejo"), "musica.mp3").unwrap();
        assert!(dest.to_string_lossy().contains("Mar"));
        assert!(dest.to_string_lossy().ends_with("musica.mp3"));
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn sanitizes_special_characters() {
        let base = temp_base("special");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let dest = build_destination_path(
            &base,
            Some("Teste/Artistas"),
            "Artist - Title (Clean?) | mix.mp3",
        )
        .unwrap();
        let name = dest.file_name().unwrap().to_string_lossy();
        assert!(!name.contains('|'), "nome: {name}");
        assert!(!name.contains('?'), "nome: {name}");
        assert!(name.contains("Artist"));
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn part_suffix_is_appended_to_final_name() {
        let final_path = PathBuf::from(r"D:\Brazilian Remix Service\musica.mp3");
        let part = part_path_for(&final_path);
        assert_eq!(part.to_string_lossy(), r"D:\Brazilian Remix Service\musica.mp3.part");
    }

    #[test]
    fn flat_download_when_preserve_disabled() {
        let base = temp_base("flat");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let dest = resolve_destination_path(&base, None, "musica.mp3", ExistingFileBehavior::Rename)
            .unwrap();
        assert!(dest.final_path.to_string_lossy().ends_with("musica.mp3"));
        assert!(!dest.final_path.to_string_lossy().contains("Funk"));
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn nested_download_when_preserve_enabled() {
        let base = temp_base("preserve");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let dest = resolve_destination_path(
            &base,
            Some("Funk/Setembro 2026"),
            "musica.mp3",
            ExistingFileBehavior::Rename,
        )
        .unwrap();
        let path = dest.final_path.to_string_lossy();
        assert!(path.contains("Funk"));
        assert!(path.contains("Setembro 2026"));
        assert!(path.ends_with("musica.mp3"));
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn renames_existing_file_with_counter() {
        let base = temp_base("rename");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let first = build_destination_path(&base, None, "musica.mp3").unwrap();
        fs::write(&first, b"1").unwrap();

        let dest = resolve_destination_path(&base, None, "musica.mp3", ExistingFileBehavior::Rename)
        .unwrap();
        assert_eq!(dest.final_path.file_name().unwrap().to_string_lossy(), "musica (1).mp3");

        fs::write(&dest.final_path, b"2").unwrap();
        let third = resolve_destination_path(&base, None, "musica.mp3", ExistingFileBehavior::Rename)
        .unwrap();
        assert_eq!(third.final_path.file_name().unwrap().to_string_lossy(), "musica (2).mp3");
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn skips_when_ignore_behavior() {
        let base = temp_base("ignore");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let first = build_destination_path(&base, None, "musica.mp3").unwrap();
        fs::write(&first, b"1").unwrap();

        let dest = resolve_destination_path(&base, None, "musica.mp3", ExistingFileBehavior::Ignore)
        .unwrap();
        assert!(dest.skipped);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn replaces_when_replace_behavior() {
        let base = temp_base("replace");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let first = build_destination_path(&base, None, "musica.mp3").unwrap();
        fs::write(&first, b"1").unwrap();

        let dest = resolve_destination_path(&base, None, "musica.mp3", ExistingFileBehavior::Replace)
            .unwrap();
        assert!(!dest.skipped);
        assert_eq!(dest.final_path, first);
        let _ = fs::remove_dir_all(&base);
    }
}
