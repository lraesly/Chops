use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder, PredefinedMenuItem},
    AppHandle, Wry,
};

pub fn create_app_menu(app: &AppHandle) -> tauri::Result<tauri::menu::Menu<Wry>> {
    // === APP MENU (macOS only - contains About, Services, Hide, Quit) ===
    #[cfg(target_os = "macos")]
    let app_menu = SubmenuBuilder::new(app, "Chops")
        .item(&PredefinedMenuItem::about(app, Some("About Chops"), None)?)
        .separator()
        .item(&PredefinedMenuItem::services(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::hide(app, None)?)
        .item(&PredefinedMenuItem::hide_others(app, None)?)
        .item(&PredefinedMenuItem::show_all(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::quit(app, None)?)
        .build()?;

    // === FILE MENU ===
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&PredefinedMenuItem::close_window(app, None)?)
        .build()?;

    // === EDIT MENU ===
    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&PredefinedMenuItem::undo(app, None)?)
        .item(&PredefinedMenuItem::redo(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, None)?)
        .item(&PredefinedMenuItem::copy(app, None)?)
        .item(&PredefinedMenuItem::paste(app, None)?)
        .item(&PredefinedMenuItem::select_all(app, None)?)
        .build()?;

    // === VIEW MENU ===
    #[cfg(target_os = "macos")]
    let view_menu = SubmenuBuilder::new(app, "View")
        .item(&PredefinedMenuItem::fullscreen(app, None)?)
        .build()?;

    // === WINDOW MENU ===
    let window_menu = SubmenuBuilder::new(app, "Window")
        .item(&PredefinedMenuItem::minimize(app, None)?)
        .item(&PredefinedMenuItem::maximize(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::close_window(app, None)?)
        .build()?;

    // === HELP MENU ===
    let shortcuts_item = MenuItemBuilder::new("Keyboard Shortcuts")
        .id("help_shortcuts")
        .build(app)?;

    let help_menu = SubmenuBuilder::new(app, "Help")
        .item(&shortcuts_item)
        .build()?;

    // === BUILD COMPLETE MENU ===
    #[cfg(target_os = "macos")]
    let menu = MenuBuilder::new(app)
        .items(&[&app_menu, &file_menu, &edit_menu, &view_menu, &window_menu, &help_menu])
        .build()?;

    #[cfg(not(target_os = "macos"))]
    let menu = MenuBuilder::new(app)
        .items(&[&file_menu, &edit_menu, &window_menu, &help_menu])
        .build()?;

    Ok(menu)
}
