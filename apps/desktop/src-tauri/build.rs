const API_URL_ENV: &str = "DWD_JEV_API_URL";

fn main() {
    // The API base URL is compiled in (see src/config.rs). Rebuild when it
    // changes, and refuse to produce a release build that would silently
    // fall back to the localhost dev URL.
    println!("cargo:rerun-if-env-changed={API_URL_ENV}");
    if std::env::var("PROFILE").as_deref() == Ok("release") && std::env::var(API_URL_ENV).is_err()
    {
        panic!("{API_URL_ENV} must be set for release builds");
    }

    // Declaring the app's own commands makes them deny-by-default: each one
    // must be granted explicitly in capabilities/*.json.
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "get_api_base_url",
            "save_refresh_token",
            "load_refresh_token",
            "clear_refresh_token",
        ]),
    ))
    .expect("failed to run tauri-build");
}
