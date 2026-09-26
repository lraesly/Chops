mod menu;

use menu::create_app_menu;
use tauri::Emitter;

#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    open::that(&path).map_err(|e| e.to_string())
}

// Shows a file selected in Finder / Explorer (or opens its folder elsewhere)
#[tauri::command]
fn reveal_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .status()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(format!("/select,{}", path))
            .status()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let folder = std::path::Path::new(&path)
            .parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| path.clone().into());
        open::that(folder).map_err(|e| e.to_string())
    }
}

// Quits after the frontend has confirmed there's nothing unsaved (menu Quit)
#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

// Moves a file to the Trash / Recycle Bin instead of deleting it outright
#[tauri::command]
fn trash_file(path: String) -> Result<(), String> {
    if !std::path::Path::new(&path).exists() {
        return Ok(());
    }
    #[cfg(target_os = "macos")]
    {
        use objc2_foundation::{NSFileManager, NSString, NSURL};
        let url = NSURL::fileURLWithPath(&NSString::from_str(&path));
        NSFileManager::defaultManager()
            .trashItemAtURL_resultingItemURL_error(&url, None)
            .map_err(|e| e.localizedDescription().to_string())
    }
    #[cfg(target_os = "windows")]
    {
        let script = format!(
            "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('{}', 'OnlyErrorDialogs', 'SendToRecycleBin')",
            path.replace('\'', "''")
        );
        let status = std::process::Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &script])
            .status()
            .map_err(|e| e.to_string())?;
        if status.success() {
            Ok(())
        } else {
            Err(format!("Could not move {} to the Recycle Bin", path))
        }
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Err("Moving files to the trash is not supported on this platform".into())
    }
}

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
        .invoke_handler(tauri::generate_handler![open_file, reveal_file, trash_file, quit_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
