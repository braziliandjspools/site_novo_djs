use futures_util::StreamExt;
use std::path::PathBuf;

fn filename_from_url(url: &str) -> String {
    reqwest::Url::parse(url)
        .ok()
        .and_then(|parsed| {
            parsed
                .path_segments()
                .and_then(|segments| segments.last())
                .map(|name| name.to_string())
        })
        .filter(|name| !name.is_empty() && name.to_ascii_lowercase().ends_with(".exe"))
        .unwrap_or_else(|| "BRS-Downloader-update-setup.exe".to_string())
}

#[cfg(target_os = "windows")]
fn powershell_single_quote(path: &str) -> String {
    format!("'{}'", path.replace('\'', "''"))
}

/// Abre o instalador pedindo elevação (UAC). `Command::spawn` direto falha com os error 740.
#[cfg(target_os = "windows")]
fn launch_installer_elevated(path: &str) -> Result<(), String> {
    let quoted = powershell_single_quote(path);
    let status = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-WindowStyle",
            "Hidden",
            "-Command",
            &format!("Start-Process -FilePath {quoted} -Verb RunAs"),
        ])
        .status()
        .map_err(|e| format!("Não foi possível abrir o instalador: {e}"))?;

    if status.success() {
        return Ok(());
    }

    Err(
        "Não foi possível abrir o instalador com permissão de administrador. \
         Confirme o UAC (Controle de Conta de Usuário) ou execute o arquivo baixado manualmente."
            .into(),
    )
}

/// Baixa o instalador via HTTP (sem abrir o navegador) e inicia o .exe.
#[tauri::command]
pub async fn download_and_launch_installer(url: String) -> Result<String, String> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err("URL do instalador vazia.".into());
    }
    if !(trimmed.starts_with("https://") || trimmed.starts_with("http://")) {
        return Err("URL do instalador inválida.".into());
    }

    let file_name = filename_from_url(trimmed);
    let temp_dir = std::env::temp_dir().join("brs-downloader-updates");
    tokio::fs::create_dir_all(&temp_dir)
        .await
        .map_err(|e| format!("Não foi possível criar pasta temporária: {e}"))?;

    let dest = temp_dir.join(&file_name);
    let part = PathBuf::from(format!("{}.part", dest.display()));

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .user_agent("BRS-Downloader-Updater/1.0")
        .build()
        .map_err(|e| format!("Falha ao preparar download: {e}"))?;

    let response = client
        .get(trimmed)
        .send()
        .await
        .map_err(|e| format!("Falha ao baixar atualização: {e}"))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("Download indisponível (HTTP {status})."));
    }

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("")
        .to_ascii_lowercase();

    if content_type.contains("text/html") || content_type.contains("application/json") {
        return Err("A URL não retornou o instalador. Confira o manifesto de atualização.".into());
    }

    let mut stream = response.bytes_stream();
    let mut file = tokio::fs::File::create(&part)
        .await
        .map_err(|e| format!("Não foi possível criar arquivo temporário: {e}"))?;

    use tokio::io::AsyncWriteExt;
    while let Some(chunk) = stream.next().await {
        let bytes = chunk.map_err(|e| format!("Falha ao receber dados: {e}"))?;
        file.write_all(&bytes)
            .await
            .map_err(|e| format!("Falha ao gravar instalador: {e}"))?;
    }
    file.flush()
        .await
        .map_err(|e| format!("Falha ao finalizar arquivo: {e}"))?;
    drop(file);

    if dest.exists() {
        let _ = tokio::fs::remove_file(&dest).await;
    }
    tokio::fs::rename(&part, &dest)
        .await
        .map_err(|e| format!("Não foi possível finalizar o instalador: {e}"))?;

    let path_str = dest.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        match launch_installer_elevated(&path_str) {
            Ok(()) => Ok(path_str),
            Err(err) => {
                // Garante que o usuário encontre o .exe mesmo se cancelar o UAC.
                let _ = std::process::Command::new("explorer")
                    .arg(format!("/select,{path_str}"))
                    .spawn();
                Err(format!(
                    "{err} Abrimos a pasta do instalador — execute o arquivo e aceite a elevação (UAC)."
                ))
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err(format!(
            "Atualização automática disponível apenas no Windows. Arquivo salvo em: {path_str}"
        ))
    }
}
