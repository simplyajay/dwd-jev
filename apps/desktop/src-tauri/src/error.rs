use serde::{Serialize, Serializer};

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("credential store error: {0}")]
    Keyring(#[from] keyring::Error),
}

/// Crosses the IPC boundary as `{ code, message }` so the frontend can branch
/// on `code` without parsing messages.
impl Serialize for Error {
    fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
        #[derive(Serialize)]
        struct Payload<'a> {
            code: &'a str,
            message: String,
        }

        let code = match self {
            Error::Keyring(_) => "credential_store",
        };
        Payload {
            code,
            message: self.to_string(),
        }
        .serialize(serializer)
    }
}

pub type Result<T> = std::result::Result<T, Error>;
