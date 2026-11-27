mod commands;
mod config;
mod error;
mod secure_store;

use serde::Serialize;
use tauri::ipc::CapabilityBuilder;
use tauri::Manager;

/// Entry in the `http:default` URL scope.
#[derive(Serialize)]
struct HttpScope {
    url: String,
}

pub fn run() {
    tauri::Builder::default()
        // Must be first: a second launch focuses the window instead of rotating the refresh token.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // Granted here, not in capabilities, so it follows the compiled-in API URL.
            let scope = HttpScope {
                url: format!("{}/*", config::api_base_url()),
            };
            app.add_capability(
                CapabilityBuilder::new("api-http")
                    .window("main")
                    .permission_scoped("http:default", vec![scope], Vec::<HttpScope>::new()),
            )?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::config::get_api_base_url,
            commands::auth::save_refresh_token,
            commands::auth::load_refresh_token,
            commands::auth::clear_refresh_token,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
