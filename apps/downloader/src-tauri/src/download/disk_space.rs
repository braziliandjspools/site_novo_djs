use std::path::{Component, Path};

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskSpaceInfo {
    pub available_bytes: u64,
    pub drive_root: String,
}

pub fn query_disk_space(path: &Path) -> Result<DiskSpaceInfo, String> {
    if !path.is_absolute() {
        return Err("Caminho de download inválido.".to_string());
    }

    if !path.exists() {
        return Err("Pasta de downloads não encontrada.".to_string());
    }

    let available_bytes =
        fs4::available_space(path).map_err(|error| format!("Não foi possível ler o espaço em disco: {error}"))?;

    Ok(DiskSpaceInfo {
        available_bytes,
        drive_root: drive_root_from_path(path),
    })
}

pub fn drive_root_from_path(path: &Path) -> String {
    let normalized = path
        .to_string_lossy()
        .strip_prefix(r"\\?\")
        .map(str::to_string)
        .unwrap_or_else(|| path.to_string_lossy().into_owned());

    if normalized.len() >= 2 {
        let bytes = normalized.as_bytes();
        if bytes[1] == b':' {
            let letter = normalized.chars().next().unwrap_or('?');
            return format!("{letter}:\\");
        }
    }

    for component in Path::new(&normalized).components() {
        if let Component::Prefix(prefix) = component {
            let root = prefix.as_os_str().to_string_lossy();
            if root.ends_with(':') {
                return format!("{root}\\");
            }
            return root.to_string();
        }
    }

    normalized
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn drive_root_from_windows_path() {
        assert_eq!(
            drive_root_from_path(Path::new(r"C:\Users\Music\BRS")),
            "C:\\"
        );
        assert_eq!(
            drive_root_from_path(Path::new(r"\\?\D:\Downloads\test")),
            "D:\\"
        );
    }

    #[test]
    fn query_disk_space_on_temp_dir() {
        let base = env::temp_dir();
        let info = query_disk_space(&base).expect("temp dir should be readable");
        assert!(info.available_bytes > 0);
        assert!(!info.drive_root.is_empty());
    }

    #[test]
    fn query_disk_space_rejects_relative_path() {
        let result = query_disk_space(Path::new("relative/path"));
        assert!(result.is_err());
    }

    #[test]
    fn query_disk_space_rejects_missing_path() {
        let base = env::temp_dir().join(format!("bp-missing-disk-{}", std::process::id()));
        let result = query_disk_space(&base);
        assert!(result.is_err());
    }
}
