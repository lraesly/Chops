mod menu;

use menu::create_app_menu;
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Create and set the application menu
            let menu = create_app_menu(app.handle())?;
            app.set_menu(menu)?;

            Ok(())
        })
        .on_menu_event(|app_handle, event| {
            let event_id = event.id().0.as_str();

            // Emit menu action to frontend
            if let Err(e) = app_handle.emit("menu-action", event_id) {
                eprintln!("Failed to emit menu event: {}", e);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
