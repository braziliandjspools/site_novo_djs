mod paths;
mod providers;
mod settings;
mod cancel;
mod duplicates;
mod disk_space;
pub mod speed_limit;
pub mod zip;

use std::path::Path;
use std::sync::Arc;

use tauri::{AppHandle, Manager, State};

use crate::app_prefs::{read_preferences, ExistingFileBehavior};

use duplicates::{analyze_duplicate, register_completed_download, resolve_duplicate_behavior, DuplicateAnalysis};
use paths::{part_path_for, resolve_destination_path};
use providers::{resolve_provider, DownloadContext, DownloadResultPayload};
use providers::cleanup_part_file;
use settings::resolve_download_dir;
use disk_space::DiskSpaceInfo;
use speed_limit::GlobalSpeedLimiter;
use cancel::{
    cancel as cancel_token, part_path_for as registered_part_path, register as register_cancel_token,
    unregister as unregister_cancel_token,
};

#[tauri::command]
pub fn has_download_dir_configured(app: AppHandle) -> Result<bool, String> {
    settings::has_download_dir_configured(&app)
}

#[tauri::command]
pub fn get_default_download_dir_path() -> String {
    settings::default_download_dir_path()
}

#[tauri::command]
pub fn get_download_dir(app: AppHandle) -> Result<String, String> {
    settings::get_download_dir(&app)
}

#[tauri::command]
pub fn set_download_dir(app: AppHandle, path: String) -> Result<String, String> {
    settings::set_download_dir(&app, path)
}

#[tauri::command]
pub async fn pick_download_dir(app: AppHandle) -> Result<Option<String>, String> {
    settings::pick_download_dir(app).await
}

#[tauri::command]
pub fn open_download_dir(app: AppHandle) -> Result<(), String> {
    settings::open_download_dir(&app)
}

#[tauri::command]
pub fn get_download_disk_space(app: AppHandle) -> Result<DiskSpaceInfo, String> {
    let base_dir = resolve_download_dir(&app)?;
    disk_space::query_disk_space(&base_dir)
}

#[tauri::command]
pub async fn download_job_file(
    app: AppHandle,
    api_base_url: String,
    provider: String,
    file_id: String,
    file_name: String,
    relative_path: Option<String>,
    auth_token: String,
    job_id: u32,
    file_size: Option<u64>,
) -> Result<DownloadResultPayload, String> {
    let prefs = read_preferences(&app)?;
    let base_dir = resolve_download_dir(&app)?;
    let effective_owned = paths::effective_relative_path(
        relative_path.as_deref(),
        prefs.preserve_folder_structure,
    );
    let effective_relative = effective_owned.as_deref();

    let candidate = paths::build_destination_path(&base_dir, effective_relative, &file_name)?;

    let analysis = analyze_duplicate(&base_dir, &file_id, &candidate, file_size);
    if analysis == DuplicateAnalysis::ProvablySame {
        return Ok(DownloadResultPayload {
            path: candidate.to_string_lossy().to_string(),
            downloaded_bytes: 0,
            total_bytes: file_size,
            skipped: true,
        });
    }

    let behavior = if analysis == DuplicateAnalysis::Conflict {
        resolve_duplicate_behavior(&app, &file_name, prefs.existing_file_behavior).await
    } else {
        prefs.existing_file_behavior
    };

    let resolved = resolve_destination_path(
        &base_dir,
        effective_relative,
        &file_name,
        behavior,
    )?;

    if resolved.skipped {
        return Ok(DownloadResultPayload {
            path: resolved.final_path.to_string_lossy().to_string(),
            downloaded_bytes: 0,
            total_bytes: file_size,
            skipped: true,
        });
    }

    let final_path = resolved.final_path;
    let part_path = part_path_for(&final_path);
    let replace_existing = behavior == ExistingFileBehavior::Replace;

    let cancel_token = register_cancel_token(job_id, part_path.clone());

    let speed_limiter = app
        .try_state::<Arc<GlobalSpeedLimiter>>()
        .map(|state| state.inner().clone())
        .unwrap_or_else(|| Arc::new(GlobalSpeedLimiter::new(0)));

    let ctx = DownloadContext {
        app: app.clone(),
        api_base_url,
        auth_token,
        file_id: file_id.clone(),
        file_name: file_name.clone(),
        final_path: final_path.clone(),
        part_path: part_path.clone(),
        job_id,
        expected_total: file_size,
        cancel_token,
        replace_existing,
        speed_limiter,
    };

    let kind = resolve_provider(&provider)?;
    let result = kind.download(ctx).await;
    unregister_cancel_token(job_id);

    if let Ok(ref payload) = result {
        if !payload.skipped && payload.downloaded_bytes > 0 {
            let size = payload.total_bytes.unwrap_or(payload.downloaded_bytes);
            let _ = register_completed_download(
                &base_dir,
                &file_id,
                &file_name,
                effective_relative,
                &final_path,
                size,
            );
        }
    }

    result
}

#[tauri::command]
pub async fn cancel_download_job(
    app: AppHandle,
    job_id: u32,
    file_name: String,
    relative_path: Option<String>,
    delete_part: bool,
) -> Result<(), String> {
    cancel_token(job_id);

    if delete_part {
        if let Some(part_path) = registered_part_path(job_id) {
            cleanup_part_file(&part_path).await;
        } else {
            let prefs = read_preferences(&app)?;
            let base_dir = resolve_download_dir(&app)?;
            let effective_owned = paths::effective_relative_path(
                relative_path.as_deref(),
                prefs.preserve_folder_structure,
            );
            let resolved = resolve_destination_path(
                &base_dir,
                effective_owned.as_deref(),
                &file_name,
                prefs.existing_file_behavior,
            )?;
            if !resolved.skipped {
                cleanup_part_file(&part_path_for(&resolved.final_path)).await;
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_max_concurrent_downloads(app: AppHandle) -> Result<u8, String> {
    settings::get_max_concurrent_downloads(&app)
}

#[tauri::command]
pub fn set_max_concurrent_downloads(app: AppHandle, value: u8) -> Result<u8, String> {
    settings::set_max_concurrent_downloads(&app, value)
}

/// Registra falha de download na pasta de destino (TXT acumulado + TXT por faixa).
/// O arquivo `falhas-download-BRS.txt` serve para o usuário enviar ao administrador/suporte.
#[tauri::command]
pub fn append_download_failure_log(
    app: AppHandle,
    file_name: String,
    relative_path: Option<String>,
    error: Option<String>,
) -> Result<String, String> {
    use std::fs::{create_dir_all, OpenOptions};
    use std::io::Write;

    let base_dir = resolve_download_dir(&app)?;
    create_dir_all(&base_dir).map_err(|e| format!("Não foi possível criar a pasta de destino: {e}"))?;

    let folder = relative_path
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("(raiz da pasta de destino)");

    let err_text = error
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("Falha desconhecida");

    let stamp = failure_log_stamp();

    let block = format!(
        "[{stamp}]\nMúsica: {file_name}\nPasta: {folder}\nMotivo do erro: {err_text}\n\nEnvie este arquivo (falhas-download-BRS.txt) ao administrador/suporte BRS se precisar de ajuda.\nVocê também pode baixar a faixa manualmente no site VIP (/musicas) ou usar \"Tentar novamente\" na fila.\n{}\n",
        "-".repeat(48)
    );

    let summary = base_dir.join("falhas-download-BRS.txt");
    {
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&summary)
            .map_err(|e| format!("Não foi possível gravar falhas-download-BRS.txt: {e}"))?;
        // Cabeçalho na primeira gravação do arquivo
        if file.metadata().map(|m| m.len()).unwrap_or(1) == 0 {
            let header = "BRS Downloader — relatório de falhas\n\
Envie este arquivo ao administrador/suporte com a descrição do problema.\n\
Cada bloco abaixo lista a música e o motivo do erro.\n\
================================================================================\n\n";
            file
                .write_all(header.as_bytes())
                .map_err(|e| format!("Falha ao escrever cabeçalho do log: {e}"))?;
        }
        file
            .write_all(block.as_bytes())
            .map_err(|e| format!("Falha ao escrever log de falhas: {e}"))?;
    }

    let stem = Path::new(&file_name)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("faixa");
    let safe: String = stem
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == ' ' || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect::<String>()
        .trim()
        .chars()
        .take(80)
        .collect();
    let safe = if safe.is_empty() {
        "faixa".to_string()
    } else {
        safe
    };
    let per_track = base_dir.join(format!("{safe}-FALHOU.txt"));
    std::fs::write(
        &per_track,
        format!(
            "BRS Downloader — falha de download\n\nMúsica: {file_name}\nPasta: {folder}\nMotivo do erro: {err_text}\nRegistrado em: {stamp}\n\nEnvie este texto (ou o arquivo falhas-download-BRS.txt da pasta de destino) ao administrador/suporte.\nVocê também pode baixar esta faixa manualmente no site VIP ou usar \"Tentar novamente\" na fila do Downloader.\n"
        ),
    )
    .map_err(|e| format!("Não foi possível gravar {}: {e}", per_track.display()))?;

    Ok(summary.to_string_lossy().to_string())
}

fn failure_log_stamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let total = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0) as i64;
    let secs = total.rem_euclid(60);
    let mins = (total / 60).rem_euclid(60);
    let hours = (total / 3600).rem_euclid(24);
    let days = total.div_euclid(86_400);
    // Algoritmo civil a partir de dias desde 1970-01-01 (Howard Hinnant).
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = if m <= 2 { y + 1 } else { y };
    format!("{year:04}-{m:02}-{d:02} {hours:02}:{mins:02}:{secs:02} UTC")
}

#[tauri::command]
pub fn get_download_speed_limit_bps(limiter: State<'_, Arc<GlobalSpeedLimiter>>) -> u64 {
    limiter.limit_bps()
}

#[tauri::command]
pub fn set_download_speed_limit_bps(
    app: AppHandle,
    limiter: State<'_, Arc<GlobalSpeedLimiter>>,
    bytes_per_second: u64,
) -> Result<u64, String> {
    let mut prefs = read_preferences(&app)?;
    crate::app_prefs::apply_speed_limit_bps(&mut prefs, bytes_per_second);
    crate::app_prefs::save_preferences(&app, &prefs)?;
    limiter.set_limit_bps(prefs.resolved_speed_limit_bps());
    Ok(limiter.limit_bps())
}
