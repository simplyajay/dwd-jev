/// Backend base URL, fixed at compile time from `DWD_JEV_API_URL`.
/// Debug builds fall back to the local backend; build.rs makes the variable
/// mandatory for release builds.
pub const API_BASE_URL: &str = match option_env!("DWD_JEV_API_URL") {
    Some(url) => url,
    None => "http://localhost:3000",
};

/// Service name for Credential Manager entries -- matches the bundle identifier.
pub const KEYRING_SERVICE: &str = "com.dwdjev.desktop";

pub fn api_base_url() -> &'static str {
    API_BASE_URL.trim_end_matches('/')
}
