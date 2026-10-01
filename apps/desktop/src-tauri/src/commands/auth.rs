use crate::error::Result;
use crate::secure_store;

#[tauri::command]
pub fn save_refresh_token(token: String) -> Result<()> {
    secure_store::save_refresh_token(&token)
}

#[tauri::command]
pub fn load_refresh_token() -> Result<Option<String>> {
    secure_store::load_refresh_token()
}

#[tauri::command]
pub fn clear_refresh_token() -> Result<()> {
    secure_store::clear_refresh_token()
}
