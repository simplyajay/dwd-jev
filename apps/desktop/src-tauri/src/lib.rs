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
        // Must be registered first. A second launch focuses the running window
        // instead of starting a new session that would rotate the refresh token.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // The HTTP scope is granted here rather than in capabilities/*.json
            // so it follows the compiled-in API URL: the webview can reach the
            // backend and nothing else.
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
