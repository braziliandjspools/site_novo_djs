#![cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            auth::get_or_create_device_id,
            auth::get_device_name,
            auth::get_platform_name,
            auth::save_session_token,
            auth::load_session_token,
            auth::clear_session_token,
            download::has_download_dir_configured,
            download::get_default_download_dir_path,
            download::get_download_dir,
            download::set_download_dir,
            download::pick_download_dir,
            download::open_download_dir,
            download::download_job_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

mod auth;
mod download;
