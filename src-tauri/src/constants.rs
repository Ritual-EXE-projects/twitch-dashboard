use std::string::ToString;

pub fn get_twitch_oauth_url() -> String {
    return std::env::var("TWITCH_OAUTH_URL").unwrap_or("https://id.twitch.tv/oauth2".to_string());
}

pub fn get_twitch_client_secret() -> String {
    return std::env::var("TWITCH_CLIENT_SECRET").expect("TWITCH_CLIENT_SECRET is not set");
}

pub fn get_client_id() -> String {
    return std::env::var("TWITCH_CLIENT_ID").expect("TWITCH_CLIENT_ID is not set");
}

pub fn get_twitch_test_user_id() -> String {
    return std::env::var("TWITCH_TEST_USER_ID").expect("TWITCH_TEST_USER_ID is not set");
}

pub fn get_oauth_mode() -> String {
    return std::env::var("TWITCH_OAUTH_MODE").unwrap_or("implicit".to_string());
}

pub const SCOPES: &str = "channel:read:redemptions channel:manage:redemptions user:read:email";
