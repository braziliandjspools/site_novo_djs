use reqwest::Method;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

const APEX_HOST: &str = "brazilianremixservice.com.br";
const CANONICAL_HOST: &str = "www.brazilianremixservice.com.br";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopApiResponse {
    pub status: u16,
    pub body: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopApiRequest {
    pub method: String,
    pub url: String,
    pub headers: Option<HashMap<String, String>>,
    pub body: Option<String>,
}

/// Apex → www: o 308 da Vercel remove Authorization e a sessão falha no Downloader.
fn canonicalize_api_url(url: &str) -> String {
    match reqwest::Url::parse(url) {
        Ok(mut parsed) => {
            if parsed
                .host_str()
                .map(|h| h.eq_ignore_ascii_case(APEX_HOST))
                .unwrap_or(false)
            {
                let _ = parsed.set_host(Some(CANONICAL_HOST));
            }
            parsed.to_string()
        }
        Err(_) => url.to_string(),
    }
}

#[tauri::command]
pub async fn desktop_api_fetch(request: DesktopApiRequest) -> Result<DesktopApiResponse, String> {
    let method = request
        .method
        .parse::<Method>()
        .map_err(|_| format!("Método HTTP inválido: {}", request.method))?;

    let url = canonicalize_api_url(&request.url);

    // Não seguir redirect automaticamente: em cross-host o Authorization é removido.
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(std::time::Duration::from_secs(20))
        .connect_timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| e.to_string())?;

    let mut current_url = url;
    let mut current_method = method;
    let mut current_body = request.body.clone();
    let headers = request.headers.unwrap_or_default();

    for _ in 0..5 {
        let mut builder = client.request(current_method.clone(), &current_url);

        for (key, value) in &headers {
            builder = builder.header(key, value);
        }

        if let Some(ref body) = current_body {
            builder = builder.body(body.clone());
        }

        let response = builder.send().await.map_err(|e| e.to_string())?;
        let status = response.status();

        if status.is_redirection() {
            let location = response
                .headers()
                .get(reqwest::header::LOCATION)
                .and_then(|v| v.to_str().ok())
                .ok_or_else(|| "Redirect sem Location".to_string())?;

            let next = if location.starts_with("http://") || location.starts_with("https://") {
                canonicalize_api_url(location)
            } else {
                let base = reqwest::Url::parse(&current_url).map_err(|e| e.to_string())?;
                canonicalize_api_url(base.join(location).map_err(|e| e.to_string())?.as_str())
            };

            // Em 301/302/303 POST vira GET sem body (RFC); 307/308 mantém método/body.
            if matches!(status.as_u16(), 301 | 302 | 303) {
                current_method = Method::GET;
                current_body = None;
            }

            current_url = next;
            continue;
        }

        let code = status.as_u16();
        let body = response.text().await.map_err(|e| e.to_string())?;
        return Ok(DesktopApiResponse { status: code, body });
    }

    Err("Muitos redirects ao falar com a API.".to_string())
}
