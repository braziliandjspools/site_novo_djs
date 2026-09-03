#![cfg_attr(mobile, tauri::mobile_entry_point)]

use tauri::{Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;

mod api_client;
mod app_prefs;
mod auth;
mod download;
mod tray;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--background"]),
        ))
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
            download::cancel_download_job,
            download::get_max_concurrent_downloads,
            download::set_max_concurrent_downloads,
            app_prefs::get_app_preferences,
            app_prefs::set_app_preferences,
            tray::show_main_window_command,
            tray::update_tray_state,
            api_client::desktop_api_fetch,
        ])
        .setup(|app| {
            tray::setup_tray(app.handle())?;

            let args: Vec<String> = std::env::args().collect();
            if args.iter().any(|arg| arg == "--background") {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }

            if let Some(window) = app.get_webview_window("main") {
                let handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        if app_prefs::should_minimize_to_tray(&handle) {
                            api.prevent_close();
                            if let Some(window) = handle.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|_app, _event| {});
}
