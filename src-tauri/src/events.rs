use tauri::{Manager, Runtime};
use serde::{de::DeserializeOwned, Deserialize, Serialize};

pub trait Event {
    const NAME: &'static str;
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthFailed {
    pub message: String,
}

impl Event for OAuthFailed {
    const NAME: &'static str = "event::oauth_failed";
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthLoggedIn {
    pub access_token: String,
}

impl Event for OAuthLoggedIn {
    const NAME: &'static str = "event::oauth_logged_in";
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginWindowClosed {}

impl Event for LoginWindowClosed {
    const NAME: &'static str = "event::login_window_closed";
}

pub fn dispatch<E: Event + Serialize, R: Runtime, M: Manager<R>>(manager: &M, event: &E) {
    let event_name = E::NAME;

    // Serialize the event
    match serde_json::to_string(event) {
        Ok(data) => {
            // Send it to all windows
            manager.trigger_global(event_name, Some(data));
            if let Err(err) = manager.emit_all(event_name, event) {
                log::error!("Error emit_all: {err:?}");
            }
        }
        Err(err) => {
            log::error!("Dispatch serialize error: {err:?}");
        }
    };
}

pub fn listen<E: Event + DeserializeOwned, R: Runtime, M: Manager<R>, F>(
    manager: &M,
    handler: F,
) -> tauri::EventHandler
    where
        F: Fn(E) -> anyhow::Result<()> + Send + 'static,
{
    let event_name = E::NAME;
    manager.listen_global(event_name, move |v| {
        let value = v
            .payload()
            .map(|p| serde_json::from_str::<E>(p))
            .transpose()
            .expect("Message from past MrHalzy, 'Perhaps you have two events with the same ID?'") // serde
            .unwrap(); // option

        if let Err(err) = handler(value) {
            log::error!("Error listen: {err:?}");
        }
    })
}

pub fn listen_once<E: Event + DeserializeOwned, R: Runtime, M: Manager<R>, F>(
    manager: &M,
    handler: F,
) -> tauri::EventHandler
    where
        F: FnOnce(E) -> anyhow::Result<()> + Send + 'static,
{
    let event_name = E::NAME;
    manager.once_global(event_name, move |v| {
        let value = v
            .payload()
            .map(|p| serde_json::from_str::<E>(p))
            .transpose()
            .expect("Message from past MrHalzy, 'Perhaps you have two events with the same ID?'") // serde
            .unwrap(); // option

        if let Err(err) = handler(value) {
            log::error!("Error listen_once: {err:?}")
        }
    })
}
