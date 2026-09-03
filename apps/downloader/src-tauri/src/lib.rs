#![cfg_attr(mobile, tauri::mobile_entry_point)]

use std::sync::Arc;

use tauri::{Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;

mod api_client;
mod app_prefs;
mod auth;
mod download;
mod tray;

pub fn run() {
    let initial_limit = 0u64;
    let speed_limiter = Arc::new(download::speed_limit::GlobalSpeedLimiter::new(initial_limit));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--background"]),
        ))
        .manage(speed_limiter)
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
            download::get_download_disk_space,
            download::download_job_file,
            download::cancel_download_job,
            download::get_max_concurrent_downloads,
            download::set_max_concurrent_downloads,
            download::get_download_speed_limit_bps,
            download::set_download_speed_limit_bps,
            download::zip::create_pack_zip,
            download::zip::cancel_pack_zip,
            download::zip::open_zip_file,
            app_prefs::get_app_preferences,
            app_prefs::set_app_preferences,
            tray::show_main_window_command,
            tray::update_tray_state,
            api_client::desktop_api_fetch,
        ])
        .setup(|app| {
            tray::setup_tray(app.handle())?;

            if let Ok(prefs) = app_prefs::read_preferences(app.handle()) {
                app_prefs::sync_speed_limiter(app.handle(), &prefs);
            }

            let args: Vec<String> = std::env::args().collect();
            let start_hidden = args.iter().any(|arg| arg == "--background");

            if start_hidden {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            } else if let Some(window) = app.get_webview_window("main") {
                let _ = window.maximize();
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
