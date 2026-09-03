use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

const TRAY_ID: &str = "main-tray";

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let menu = build_tray_menu(app, 0, false)?;
    let icon = app
        .default_window_icon()
        .ok_or("Ícone padrão indisponível.")?
        .clone();

    let app_handle = app.clone();
    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .tooltip("BRS Downloader")
        .menu(&menu)
        .on_menu_event(move |app, event| {
            handle_tray_menu(app, &app_handle, event.id.as_ref());
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::DoubleClick { button: _, .. } = event {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

fn build_tray_menu(app: &AppHandle, active_count: u32, paused: bool) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let pause_label = if paused {
        "Retomar downloads"
    } else {
        "Pausar downloads"
    };

    Menu::with_items(
        app,
        &[
            &MenuItem::with_id(app, "title", "BRS Downloader", false, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "open", "Abrir", true, None::<&str>)?,
            &MenuItem::with_id(
                app,
                "active_count",
                &format!("Downloads ativos: {active_count}"),
                false,
                None::<&str>,
            )?,
            &MenuItem::with_id(app, "open_folder", "Abrir pasta", true, None::<&str>)?,
            &MenuItem::with_id(app, "pause_downloads", pause_label, true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?,
        ],
    )
}

fn handle_tray_menu(app: &AppHandle, _app_handle: &AppHandle, id: &str) {
    match id {
        "open" => {
            show_main_window(app);
        }
        "open_folder" => {
            if let Err(error) = crate::download::open_download_dir(app.clone()) {
                let _ = app.emit("tray-error", error);
            }
        }
        "pause_downloads" => {
            let _ = app.emit("tray-toggle-pause", ());
        }
        "quit" => {
            app.exit(0);
        }
        _ => {}
    }
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

pub fn update_tray_menu(app: AppHandle, active_count: u32, paused: bool) -> Result<(), String> {
    let Some(tray) = app.tray_by_id(TRAY_ID) else {
        return Ok(());
    };
    let menu = build_tray_menu(&app, active_count, paused).map_err(|e| e.to_string())?;
    tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn show_main_window_command(app: AppHandle) -> Result<(), String> {
    show_main_window(&app);
    Ok(())
}

#[tauri::command]
pub fn update_tray_state(app: AppHandle, active_count: u32, paused: bool) -> Result<(), String> {
    update_tray_menu(app, active_count, paused)
}
