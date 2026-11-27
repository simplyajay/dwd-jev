#[tauri::command]
pub fn get_api_base_url() -> &'static str {
    crate::config::api_base_url()
}
