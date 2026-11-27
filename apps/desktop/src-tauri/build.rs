const API_URL_ENV: &str = "DWD_JEV_API_URL";

fn main() {
    // Rebuild when the API URL changes; release builds must set it (see src/config.rs).
    println!("cargo:rerun-if-env-changed={API_URL_ENV}");
    if std::env::var("PROFILE").as_deref() == Ok("release") && std::env::var(API_URL_ENV).is_err()
    {
        panic!("{API_URL_ENV} must be set for release builds");
    }

    // Declared commands are deny-by-default: grant each in capabilities/*.json.
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
