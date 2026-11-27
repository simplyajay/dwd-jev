//! Thin wrapper over the Windows Credential Manager.

use keyring::Entry;

use crate::config::KEYRING_SERVICE;
use crate::error::Result;

const REFRESH_TOKEN_KEY: &str = "refresh_token";

fn refresh_token_entry() -> Result<Entry> {
    Ok(Entry::new(KEYRING_SERVICE, REFRESH_TOKEN_KEY)?)
}

pub fn save_refresh_token(token: &str) -> Result<()> {
    Ok(refresh_token_entry()?.set_password(token)?)
}

/// `None` when no token has been stored (first run, or after logout).
pub fn load_refresh_token() -> Result<Option<String>> {
    match refresh_token_entry()?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(err.into()),
    }
}

/// Idempotent: clearing an absent token is not an error.
pub fn clear_refresh_token() -> Result<()> {
    match refresh_token_entry()?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(err.into()),
    }
}
