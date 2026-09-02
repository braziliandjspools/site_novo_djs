use std::fs;
use std::path::{Component, Path, PathBuf};

pub fn default_download_dir() -> PathBuf {
    if let Ok(temp) = std::env::var("TEMP").or_else(|_| std::env::var("TMP")) {
        return PathBuf::from(temp).join("BrazilianPacks");
    }
    if let Ok(user_profile) = std::env::var("USERPROFILE") {
        return PathBuf::from(user_profile)
            .join("Music")
            .join("Brazilian Packs");
    }
    if let Some(home) = dirs::home_dir() {
        return home.join("Music").join("Brazilian Packs");
    }
    PathBuf::from("Brazilian Packs")
}

fn sanitize_segment(segment: &str) -> Option<String> {
    let trimmed = segment.trim();
    if trimmed.is_empty() || trimmed == "." || trimmed == ".." {
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

    if clean.is_empty() {
        None
    } else {
        Some(clean)
    }
}

fn sanitize_relative_path(relative_path: Option<&str>) -> Vec<String> {
    let Some(raw) = relative_path else {
        return Vec::new();
    };

    let mut parts = Vec::new();
    for segment in Path::new(raw).components() {
        if let Component::Normal(value) = segment {
            if let Some(clean) = sanitize_segment(&value.to_string_lossy()) {
                parts.push(clean);
            }
        }
    }
    parts
}

pub fn build_destination_path(
    base_dir: &Path,
    relative_path: Option<&str>,
    file_name: &str,
) -> Result<PathBuf, String> {
    let file_segment =
        sanitize_segment(file_name).ok_or_else(|| "Nome de arquivo inválido.".to_string())?;

    let mut dest = base_dir.to_path_buf();
    for part in sanitize_relative_path(relative_path) {
        dest.push(part);
    }
    dest.push(file_segment);

    let base = base_dir
        .canonicalize()
        .unwrap_or_else(|_| base_dir.to_path_buf());
    let parent = dest
        .parent()
        .ok_or_else(|| "Destino inválido.".to_string())?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;

    let resolved_parent = parent.canonicalize().map_err(|e| e.to_string())?;
    if !resolved_parent.starts_with(&base) {
        return Err("Caminho de destino inválido.".to_string());
    }

    Ok(dest)
}
