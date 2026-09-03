//! Compactação ZIP pós-download (compatível com Explorador do Windows).
//! Streaming via crate `zip` (DEFLATE). Não extrai ZIP.

mod cancel;

use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Write};
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Instant;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use zip::write::SimpleFileOptions;
use zip::CompressionMethod;
use zip::ZipWriter;

use crate::app_prefs::{read_preferences, ExistingFileBehavior};
use crate::download::paths::find_unique_path;
use crate::download::settings::resolve_download_dir;

use self::cancel::{cancel as cancel_zip_token, register as register_zip_token, unregister as unregister_zip_token};

const PART_SUFFIX: &str = ".part";
const INDEX_FILE: &str = ".brs-download-index.json";
const ZIP_TEMP_SUFFIX: &str = ".brs-zip.tmp";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZipFileEntry {
    pub absolute_path: String,
    pub archive_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePackZipRequest {
    pub task_id: String,
    pub zip_name: String,
    pub files: Vec<ZipFileEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePackZipResult {
    pub zip_path: String,
    pub file_count: u32,
    pub cancelled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZipProgressPayload {
    pub task_id: String,
    pub done: u32,
    pub total: u32,
    pub percent: u32,
    pub phase: String,
    pub current_file: Option<String>,
}

fn zip_busy() -> &'static Mutex<Option<String>> {
    static BUSY: OnceLock<Mutex<Option<String>>> = OnceLock::new();
    BUSY.get_or_init(|| Mutex::new(None))
}

fn sanitize_zip_base_name(name: &str) -> String {
    let trimmed = name.trim().trim_end_matches('.').trim_end_matches(' ');
    let mut clean = String::new();
    for ch in trimmed.chars() {
        if matches!(ch, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' | '\0') {
            continue;
        }
        clean.push(ch);
    }
    let clean = clean.trim().trim_end_matches('.').trim_end_matches(' ');
    if clean.is_empty() {
        "Downloads".to_string()
    } else if clean.len() > 120 {
        clean.chars().take(120).collect()
    } else {
        clean.to_string()
    }
}

fn normalize_archive_path(raw: &str) -> Result<String, String> {
    let mut parts = Vec::new();
    for segment in Path::new(raw).components() {
        match segment {
            Component::Normal(value) => {
                let text = value.to_string_lossy();
                if text.ends_with(PART_SUFFIX) {
                    return Err("Arquivo temporário .part não pode entrar no ZIP.".into());
                }
                if text.eq_ignore_ascii_case(INDEX_FILE) {
                    return Err("Arquivo de índice interno não pode entrar no ZIP.".into());
                }
                parts.push(text.replace('\\', "/"));
            }
            Component::CurDir => {}
            _ => return Err("Caminho de arquivo no ZIP inválido.".into()),
        }
    }
    if parts.is_empty() {
        return Err("Caminho de arquivo no ZIP vazio.".into());
    }
    Ok(parts.join("/"))
}

fn resolve_safe_file(base: &Path, absolute: &Path) -> Result<PathBuf, String> {
    if !absolute.exists() {
        return Err(format!(
            "Arquivo não encontrado antes da compactação: {}",
            absolute.display()
        ));
    }

    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        let meta = fs::symlink_metadata(absolute)
            .map_err(|e| format!("Não foi possível ler metadados: {e}"))?;
        const REPARSE_POINT: u32 = 0x400;
        if meta.file_attributes() & REPARSE_POINT != 0 {
            return Err("Atalhos/reparse points fora da pasta não são permitidos no ZIP.".into());
        }
    }

    #[cfg(unix)]
    {
        let meta = fs::symlink_metadata(absolute)
            .map_err(|e| format!("Não foi possível ler metadados: {e}"))?;
        if meta.file_type().is_symlink() {
            return Err("Links simbólicos não são permitidos no ZIP.".into());
        }
    }

    let canonical = absolute
        .canonicalize()
        .map_err(|e| format!("Destino inválido: {e}"))?;
    if !canonical.starts_with(base) {
        return Err("Arquivo fora da pasta de downloads — rejeitado por segurança.".into());
    }
    if !canonical.is_file() {
        return Err("Somente arquivos regulares podem entrar no ZIP.".into());
    }
    Ok(canonical)
}

fn resolve_zip_output_path(
    base: &Path,
    zip_name: &str,
    behavior: ExistingFileBehavior,
) -> Result<PathBuf, String> {
    let safe_name = sanitize_zip_base_name(zip_name);
    let candidate = base.join(format!("{safe_name}.zip"));

    if !candidate.exists() {
        return Ok(candidate);
    }

    match behavior {
        ExistingFileBehavior::Ignore => Err(
            "Já existe um ZIP com este nome e a opção de duplicados está em \"Ignorar\".".into(),
        ),
        ExistingFileBehavior::Replace => Ok(candidate),
        ExistingFileBehavior::Rename | ExistingFileBehavior::Ask => find_unique_path(&candidate),
    }
}

fn emit_progress(app: &AppHandle, payload: ZipProgressPayload) {
    let _ = app.emit("zip-progress", &payload);
}

fn create_zip_blocking(
    app: &AppHandle,
    task_id: &str,
    zip_path: &Path,
    files: &[(PathBuf, String)],
    cancel_flag: Arc<AtomicBool>,
) -> Result<(), String> {
    let total = files.len() as u32;
    println!(
        "[zip] início task={} arquivos={} destino={}",
        task_id,
        total,
        zip_path.display()
    );

    let temp_path = PathBuf::from(format!(
        "{}{}",
        zip_path.to_string_lossy(),
        ZIP_TEMP_SUFFIX
    ));
    if temp_path.exists() {
        let _ = fs::remove_file(&temp_path);
    }

    let file = File::create(&temp_path).map_err(|e| {
        let _ = fs::remove_file(&temp_path);
        format!("Não foi possível criar o arquivo ZIP. Seus arquivos baixados foram mantidos. ({e})")
    })?;
    let writer = BufWriter::new(file);
    let mut zip = ZipWriter::new(writer);
    let options = SimpleFileOptions::default()
        .compression_method(CompressionMethod::Deflated)
        .unix_permissions(0o644);

    for (index, (abs, archive)) in files.iter().enumerate() {
        if cancel_flag.load(Ordering::SeqCst) {
            let _ = zip.finish();
            let _ = fs::remove_file(&temp_path);
            println!("[zip] cancelado task={task_id}");
            return Err("CANCELLED".into());
        }

        let done = index as u32;
        let percent = if total == 0 { 0 } else { (done * 100) / total };
        emit_progress(
            app,
            ZipProgressPayload {
                task_id: task_id.to_string(),
                done,
                total,
                percent,
                phase: "compressing".into(),
                current_file: Some(archive.clone()),
            },
        );

        zip.start_file(archive, options)
            .map_err(|e| format!("Falha ao adicionar arquivo ao ZIP: {e}"))?;

        let input = File::open(abs).map_err(|e| format!("Não foi possível ler arquivo: {e}"))?;
        let mut reader = BufReader::new(input);
        std::io::copy(&mut reader, &mut zip)
            .map_err(|e| format!("Falha ao gravar no ZIP: {e}"))?;

        if index + 1 < files.len() {
            std::thread::sleep(std::time::Duration::from_millis(2));
        }
    }

    if cancel_flag.load(Ordering::SeqCst) {
        let _ = zip.finish();
        let _ = fs::remove_file(&temp_path);
        println!("[zip] cancelado task={task_id}");
        return Err("CANCELLED".into());
    }

    zip.finish()
        .map_err(|e| format!("Não foi possível finalizar o ZIP: {e}"))?
        .flush()
        .map_err(|e| format!("Não foi possível gravar o ZIP: {e}"))?;

    if zip_path.exists() {
        let _ = fs::remove_file(zip_path);
    }
    fs::rename(&temp_path, zip_path).map_err(|e| {
        let _ = fs::remove_file(&temp_path);
        format!("Não foi possível mover o ZIP final: {e}")
    })?;

    emit_progress(
        app,
        ZipProgressPayload {
            task_id: task_id.to_string(),
            done: total,
            total,
            percent: 100,
            phase: "done".into(),
            current_file: None,
        },
    );

    println!(
        "[zip] concluído task={} arquivos={} destino={}",
        task_id,
        total,
        zip_path.display()
    );
    Ok(())
}

#[tauri::command]
pub async fn create_pack_zip(
    app: AppHandle,
    request: CreatePackZipRequest,
) -> Result<CreatePackZipResult, String> {
    if request.files.is_empty() {
        return Err("Nenhum arquivo para compactar.".into());
    }

    {
        let mut busy = zip_busy().lock().expect("zip busy lock");
        if busy.is_some() {
            return Err("Já existe uma compactação em andamento. Aguarde terminar.".into());
        }
        *busy = Some(request.task_id.clone());
    }

    let cancel_flag = register_zip_token(&request.task_id);
    let started = Instant::now();
    let file_count_requested = request.files.len() as u32;

    let result: Result<CreatePackZipResult, String> = async {
        let prefs = read_preferences(&app)?;
        let base_dir = resolve_download_dir(&app)?;
        let base = base_dir
            .canonicalize()
            .map_err(|e| format!("Pasta de downloads inválida: {e}"))?;

        println!(
            "[zip] origem={} task={} nome={}",
            base.display(),
            request.task_id,
            request.zip_name
        );

        let mut prepared: Vec<(PathBuf, String)> = Vec::with_capacity(request.files.len());
        for entry in &request.files {
            let abs = PathBuf::from(&entry.absolute_path);
            let safe = resolve_safe_file(&base, &abs)?;
            let archive = normalize_archive_path(&entry.archive_path)?;
            if archive.to_ascii_lowercase().ends_with(".zip") {
                continue;
            }
            if safe
                .file_name()
                .and_then(|n| n.to_str())
                .map(|n| n.ends_with(PART_SUFFIX) || n.ends_with(ZIP_TEMP_SUFFIX))
                .unwrap_or(false)
            {
                continue;
            }
            prepared.push((safe, archive));
        }

        if prepared.is_empty() {
            return Err("Nenhum arquivo válido para compactar (temporários/.part ignorados).".into());
        }

        let prepared_count = prepared.len() as u32;

        let behavior = if prefs.existing_file_behavior == ExistingFileBehavior::Ask {
            ExistingFileBehavior::Rename
        } else {
            prefs.existing_file_behavior
        };

        let zip_path = resolve_zip_output_path(&base, &request.zip_name, behavior)?;
        prepared.retain(|(path, _)| path != &zip_path);

        let app2 = app.clone();
        let task_id = request.task_id.clone();
        let zip_path_clone = zip_path.clone();
        let flag = cancel_flag.clone();

        tauri::async_runtime::spawn_blocking(move || {
            create_zip_blocking(&app2, &task_id, &zip_path_clone, &prepared, flag)
        })
        .await
        .map_err(|e| format!("Falha interna na compactação: {e}"))??;

        Ok(CreatePackZipResult {
            zip_path: zip_path.to_string_lossy().to_string(),
            file_count: prepared_count,
            cancelled: false,
        })
    }
    .await;

    unregister_zip_token(&request.task_id);
    *zip_busy().lock().expect("zip busy lock") = None;

    match result {
        Ok(ok) => {
            println!(
                "[zip] duração_ms={} task={} requested={}",
                started.elapsed().as_millis(),
                request.task_id,
                file_count_requested
            );
            Ok(ok)
        }
        Err(err) if err == "CANCELLED" => Ok(CreatePackZipResult {
            zip_path: String::new(),
            file_count: 0,
            cancelled: true,
        }),
        Err(err) => {
            println!("[zip] erro task={} msg={}", request.task_id, err);
            Err(if err.contains("arquivos baixados foram mantidos") {
                err
            } else {
                format!(
                    "Não foi possível criar o arquivo ZIP. Seus arquivos baixados foram mantidos. ({err})"
                )
            })
        }
    }
}

#[tauri::command]
pub fn cancel_pack_zip(task_id: String) -> bool {
    println!("[zip] pedido de cancelamento task={task_id}");
    cancel_zip_token(&task_id)
}

#[tauri::command]
pub fn open_zip_file(path: String) -> Result<(), String> {
    let path = PathBuf::from(path.trim());
    if !path.exists() {
        return Err("Arquivo ZIP não encontrado.".into());
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Não foi possível abrir o ZIP: {e}"))?;
        return Ok(());
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = path;
        Err("Abrir ZIP disponível apenas no Windows.".into())
    }
}

#[cfg(test)]
pub fn collect_files_under_for_test(base: &Path, folder: &Path) -> Result<Vec<PathBuf>, String> {
    use walkdir::WalkDir;
    let base_c = base.canonicalize().map_err(|e| e.to_string())?;
    let folder_c = folder.canonicalize().map_err(|e| e.to_string())?;
    if !folder_c.starts_with(&base_c) {
        return Err("Pasta fora da base".into());
    }
    let mut out = Vec::new();
    for entry in WalkDir::new(&folder_c).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_file() {
            continue;
        }
        let path = entry.path();
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if name.ends_with(PART_SUFFIX) || name == INDEX_FILE || name.ends_with(ZIP_TEMP_SUFFIX) {
            continue;
        }
        let canon = match resolve_safe_file(&base_c, path) {
            Ok(p) => p,
            Err(_) => continue,
        };
        out.push(canon);
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::io::Read;
    use zip::ZipArchive;

    fn temp_base(name: &str) -> PathBuf {
        env::temp_dir().join(format!("bp-zip-test-{name}-{}", std::process::id()))
    }

    fn reset(base: &Path) {
        let _ = fs::remove_dir_all(base);
        fs::create_dir_all(base).unwrap();
    }

    fn write_zip_direct(zip_path: &Path, files: &[(PathBuf, String)]) {
        let file = File::create(zip_path).unwrap();
        let mut zip = ZipWriter::new(BufWriter::new(file));
        let options = SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);
        for (abs, archive) in files {
            zip.start_file(archive, options).unwrap();
            let mut input = File::open(abs).unwrap();
            std::io::copy(&mut input, &mut zip).unwrap();
        }
        zip.finish().unwrap();
    }

    #[test]
    fn sanitize_removes_invalid_chars() {
        assert_eq!(sanitize_zip_base_name("Julho 2026?/Pack"), "Julho 2026Pack");
        assert_eq!(sanitize_zip_base_name("   "), "Downloads");
    }

    #[test]
    fn zip_single_and_multiple_with_subfolders() {
        let base = temp_base("multi");
        reset(&base);
        let funk = base.join("Pack").join("Funk");
        let sert = base.join("Pack").join("Sertanejo");
        fs::create_dir_all(&funk).unwrap();
        fs::create_dir_all(&sert).unwrap();
        let f1 = funk.join("faixa1.mp3");
        let f2 = funk.join("faixa2.mp3");
        let f3 = sert.join("faixa3.mp3");
        fs::write(&f1, b"aaa").unwrap();
        fs::write(&f2, b"bbbb").unwrap();
        fs::write(&f3, b"ccccc").unwrap();

        let zip_path = base.join("Pack.zip");
        write_zip_direct(
            &zip_path,
            &[
                (f1, "Funk/faixa1.mp3".into()),
                (f2, "Funk/faixa2.mp3".into()),
                (f3, "Sertanejo/faixa3.mp3".into()),
            ],
        );

        let archive = ZipArchive::new(File::open(&zip_path).unwrap()).unwrap();
        assert_eq!(archive.len(), 3);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn accents_and_long_names() {
        let base = temp_base("accents");
        reset(&base);
        let dir = base.join("Março 2026");
        fs::create_dir_all(&dir).unwrap();
        let long = "a".repeat(80);
        let file = dir.join(format!("Música — {long}.mp3"));
        fs::write(&file, b"x").unwrap();
        let zip_path = base.join(format!("{}.zip", sanitize_zip_base_name("Março 2026")));
        write_zip_direct(&zip_path, &[(file, format!("Março 2026/Música — {long}.mp3"))]);
        let archive = ZipArchive::new(File::open(&zip_path).unwrap()).unwrap();
        assert_eq!(archive.len(), 1);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn duplicate_rename_strategy() {
        let base = temp_base("dup");
        reset(&base);
        let existing = base.join("Pack.zip");
        fs::write(&existing, b"old").unwrap();
        let unique = find_unique_path(&existing).unwrap();
        assert_eq!(unique.file_name().unwrap().to_string_lossy(), "Pack (1).zip");
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn rejects_part_and_external_paths() {
        let base = temp_base("secure");
        reset(&base);
        let inside = base.join("ok.mp3");
        fs::write(&inside, b"1").unwrap();

        assert!(normalize_archive_path("Funk/x.mp3.part").is_err());

        let outside = env::temp_dir().join(format!("bp-zip-outside-{}", std::process::id()));
        fs::write(&outside, b"3").unwrap();
        let base_c = base.canonicalize().unwrap();
        assert!(resolve_safe_file(&base_c, &outside).is_err());
        assert!(resolve_safe_file(&base_c, &inside).is_ok());

        let _ = fs::remove_file(&outside);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn skips_part_when_collecting() {
        let base = temp_base("collect");
        reset(&base);
        let pack = base.join("Pack");
        fs::create_dir_all(&pack).unwrap();
        fs::write(pack.join("a.mp3"), b"1").unwrap();
        fs::write(pack.join("a.mp3.part"), b"2").unwrap();
        let files = collect_files_under_for_test(&base, &pack).unwrap();
        assert_eq!(files.len(), 1);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn large_file_streams_ok() {
        let base = temp_base("large");
        reset(&base);
        let file = base.join("big.mp3");
        let data = vec![9u8; 256 * 1024];
        fs::write(&file, &data).unwrap();
        let zip_path = base.join("big.zip");
        write_zip_direct(&zip_path, &[(file, "big.mp3".into())]);
        let mut archive = ZipArchive::new(File::open(&zip_path).unwrap()).unwrap();
        let mut out = Vec::new();
        archive.by_name("big.mp3").unwrap().read_to_end(&mut out).unwrap();
        assert_eq!(out.len(), data.len());
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn missing_file_errors() {
        let base = temp_base("missing");
        reset(&base);
        let base_c = base.canonicalize().unwrap();
        let missing = base.join("gone.mp3");
        assert!(resolve_safe_file(&base_c, &missing).is_err());
        let _ = fs::remove_dir_all(&base);
    }
}
