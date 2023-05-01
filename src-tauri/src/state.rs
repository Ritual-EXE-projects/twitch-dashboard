use std::sync::atomic::{AtomicBool, Ordering};

pub(crate) struct OauthState {
    pub login_closed_prematurely: AtomicBool,
    pub oauth_flow_completed: AtomicBool,
    pub oauth_flow_failed: AtomicBool,
}

impl OauthState {
    pub fn reset(&self) {
        self.login_closed_prematurely.store(false, Ordering::Release);
        self.oauth_flow_completed.store(false, Ordering::Release);
        self.oauth_flow_failed.store(false, Ordering::Release);
    }
}

impl Default for OauthState {
   fn default() -> Self {
        Self {
            login_closed_prematurely: AtomicBool::new(false),
            oauth_flow_completed: AtomicBool::new(false),
            oauth_flow_failed: AtomicBool::new(false),
        }
    }
}