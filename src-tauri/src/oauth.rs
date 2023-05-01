use std::{
    net::Ipv4Addr,
    sync::{Arc, atomic::Ordering, Mutex},
    time::Duration,
};

use anyhow::Error;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, Wry};
use tiny_http::{Request, Response, Server, StatusCode};
use url::form_urlencoded::Parse;
use url::Url;

use crate::constants::{get_client_id, get_oauth_mode, get_twitch_client_secret, get_twitch_oauth_url, get_twitch_test_user_id, SCOPES};
use crate::events;
use crate::state::OauthState;

// OAuth flow adapted from Mr.Halzy's Twitch Voice - MIT
// https://git.sr.ht/~halzy/twitch-voices/tree/main

#[tauri::command]
pub fn start_login(app_handle: AppHandle<Wry>) {
    let mode = get_oauth_mode();
    log::info!("Starting login with mode: {}", mode);

    match mode.as_str() {
        "code" => start_code_login(app_handle),
        "implicit" => start_implicit_login(app_handle),
        _ => start_implicit_login(app_handle),
    }
}

fn start_code_login(app_handle: AppHandle<Wry>) {
    std::thread::spawn(move || {
        log::info!("Starting code login");
        app_handle.state::<OauthState>().reset();
        match make_code_request() {
            Ok(response) => {
                log::info!("Code login successful");
                app_handle.emit_all("oauth:authenticated", &events::OAuthLoggedIn {
                    access_token: response.access_token
                })
                    .expect("can emit oauth:authenticated");
            }
            Err(err) => {
                log::error!("Code login failed: {}", err);
                app_handle.emit_all("oauth:failed", &events::OAuthFailed {
                    message: format!("Code login failed: {}", err)
                })
                    .expect("can emit oauth:failed");
            }
        };
    });
}

#[derive(Serialize, Deserialize, Debug)]
struct CodeRequest {
    client_id: String,
    client_secret: String,
    grant_type: String,
    scope: String,
    user_id: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct CodeResponse {
    access_token: String,
    refresh_token: String,
    expires_in: u32,
    scope: Vec<String>,
    token_type: String,
}

fn make_code_request() -> Result<CodeResponse, Error> {
    let mut mapParams = std::collections::HashMap::new();

    mapParams.insert("client_secret", get_twitch_client_secret());
    mapParams.insert("client_id", get_client_id());
    mapParams.insert("grant_type", "user_token".to_string());
    mapParams.insert("scope", SCOPES.to_string());
    mapParams.insert("user_id", get_twitch_test_user_id());
    let url = format!("{}/authorize", get_twitch_oauth_url());
    let url = Url::parse_with_params(url.as_str(), &mapParams)?;

    log::info!("Making request to {}", url);
    let client = reqwest::blocking::Client::new();
    let mut response = client.post(url)
        .header("Content-Type", "application/www-form-urlencoded")
        .send()
        .unwrap();
    match response.status() {
        reqwest::StatusCode::OK => {
            match response.json::<CodeResponse>() {
                Ok(parsed) => Ok(parsed),
                Err(_) => Err(anyhow::anyhow!("Error parsing response")),
            }
        }
        other => {
            log::error!("{}", other);
            log::error!("{:?}", response.text());
            log::error!("{:?}", mapParams);
            Err(anyhow::anyhow!("Error making request: {}", other))
        }
    }
}

fn start_implicit_login(app_handle: AppHandle<Wry>) {
    const RANDOM_PORTS: [u16; 10] = [17041, 27741, 44927, 41443, 56612, 58121, 53147, 15099, 64380, 32097];

    app_handle.state::<OauthState>().reset();

    for port in RANDOM_PORTS {
        match start_login_inner(&app_handle, port) {
            Ok(_) => break,
            Err(err) => {
                log::error!("Error starting oauth: {}", err);
            }
        }
    }
}

fn start_login_inner(app_handle: &AppHandle<Wry>, port: u16) -> anyhow::Result<()> {
    log::info!("Attempting to start oauth server on port {port}");
    let address = Ipv4Addr::new(127, 0, 0, 1);
    let server = Server::http((address, port)).map_err(|e| anyhow::anyhow!(e.to_string()))?;

    let server_app_handle = app_handle.clone();
    std::thread::spawn(move || {
        log::info!("Starting oauth server on port {port}");
        run(server, server_app_handle);
    });

    configure_event_listeners(app_handle);
    open_login_window(app_handle, port);
    Ok(())
}

fn configure_event_listeners(app_handle: &AppHandle<Wry>) -> anyhow::Result<()> {
    let success = Arc::new(Mutex::new(None));
    let success_failed = Arc::clone(&success);
    let success_window = Arc::clone(&success);

    let failed = Arc::new(Mutex::new(None));
    let failed_success = Arc::clone(&failed);
    let failed_window = Arc::clone(&failed);

    let window = Arc::new(Mutex::new(None));
    let window_success = Arc::clone(&window);
    let window_failed = Arc::clone(&window);

    let app_handle_failed = app_handle.clone();
    let f = events::listen_once(app_handle, move |event: events::OAuthFailed| -> anyhow::Result<()> {
        log::warn!("OAuth failed: {}", event.message);
        if let Some(login_window) = app_handle_failed.get_window("login") {
            login_window.close().unwrap();
        }

        app_handle_failed
            .state::<OauthState>()
            .login_closed_prematurely
            .store(true, Ordering::Relaxed);

        app_handle_failed.emit_all("oauth:failed", &events::OAuthFailed { message: event.message }).expect("can emit oauth:failed on window");

        app_handle_failed.unlisten(success_failed.lock().unwrap().take().unwrap());
        app_handle_failed.unlisten(window_failed.lock().unwrap().take().unwrap());
        Ok(())
    });
    failed.lock().unwrap().replace(f);

    let app_handle_success = app_handle.clone();
    let s = events::listen_once(app_handle, move |event: events::OAuthLoggedIn| -> anyhow::Result<()> {
        app_handle_success.state::<OauthState>().oauth_flow_completed.store(true, Ordering::Relaxed);

        if let Some(login_window) = app_handle_success.get_window("login") {
            login_window.close().expect("can close login window");
        }

        // Let the UI know auth has happened
        app_handle_success
            .emit_all("oauth:authenticated", &events::OAuthLoggedIn {
                access_token: event.access_token
            })
            .expect("can emit oauth:authenticated");
        app_handle_success.unlisten(failed_success.lock().unwrap().take().unwrap());
        app_handle_success.unlisten(window_success.lock().unwrap().take().unwrap());
        Ok(())
    });

    success.lock().unwrap().replace(s);

    // handle OAuth flow success
    let app_handle_window = app_handle.clone();
    let w = events::listen_once(
        app_handle,
        move |_event: events::LoginWindowClosed| -> anyhow::Result<()> {
            // Shuts down the server
            // Let the oauth system know the login window closed
            app_handle_window
                .state::<OauthState>()
                .login_closed_prematurely
                .store(true, Ordering::Relaxed);
            app_handle_window.emit_all("oauth:failed", &events::OAuthFailed {
                message: "Login window closed prematurely".to_string(),
            }).expect("can emit oauth:failed");

            app_handle_window.unlisten(success_window.lock().unwrap().take().unwrap());
            app_handle_window.unlisten(failed_window.lock().unwrap().take().unwrap());
            Ok(())
        },
    );
    window.lock().unwrap().replace(w);
    Ok(())
}

fn open_login_window(app_handle: &AppHandle<Wry>, port: u16) -> anyhow::Result<()> {
    let redirect_uri = format!("http://localhost:{port}/callback", port = port);
    let login_url = format!("{TWITCH_OAUTH_URL}/authorize?client_id={CLIENT_ID}&redirect_uri={redirect_uri}&response_type=token&scope={SCOPES}&force_verify=true", CLIENT_ID = get_client_id(), redirect_uri = redirect_uri, SCOPES = SCOPES, TWITCH_OAUTH_URL = get_twitch_oauth_url());
    log::debug!("Login URL: {}", login_url);

    let window_url = tauri::WindowUrl::External(login_url.parse().unwrap());

    let login_window = tauri::WindowBuilder::new(app_handle, "login", window_url);
    login_window
        .always_on_top(true)
        .center()
        .focused(true)
        .title("Twitch Login")
        .inner_size(550.0, 825.0)
        .build()
        .unwrap()
        .show()?;

    Ok(())
}

fn run(server: Server, app_handle: AppHandle<Wry>) {
    loop {
        if let Err(error) = run_loop(&server, &app_handle) {
            log::error!("Error in oauth server: {}", error);
        }
        // Shutdown the server if the login window closed prematurely
        if app_handle.state::<OauthState>().login_closed_prematurely
            .load(Ordering::Relaxed) {
            return;
        }

        // Shutdown the server if the oauth flow completed
        if app_handle
            .state::<OauthState>()
            .oauth_flow_completed
            .load(Ordering::Relaxed) {
            return;
        }

        // Shut down the server if the flow fails
        if app_handle
            .state::<OauthState>()
            .oauth_flow_failed
            .load(Ordering::Relaxed)
        {
            return;
        }
    }
}

fn run_loop(server: &Server, app_handle: &AppHandle<Wry>) -> anyhow::Result<()> {
    // blocks until the next request is received
    if let Some(request) = server.recv_timeout(Duration::from_millis(100))? {
        match request.url() {
            "/finish" => handle_finish(request, app_handle)?,
            // Fall-though handles /callback*
            _ => handle_callback(request)?,
        }
    }

    Ok(())
}


fn handle_callback(request: Request) -> anyhow::Result<()> {
    let host_header = request.headers().iter().find_map(|h| h.field.equiv("host").then(|| h.value.as_str().to_string()))
        .unwrap_or_default();

    log::debug!("Callback host header: {}", host_header);

    let url = format!("http://{}/finish", host_header);
    let page = format!(
        r#"
        <html>
            <head><title>Twitch Voices</title></head>
            <body>
                <style>
                    .body {{
                        text-align: center;
                    }}
                </style>
                <script>
                fetch("{}", {{headers:{{'X-Full-Url':window.location.href}}}}).then((response) => {{
                    if (response.status == 200) {{
                        document.write("You have been logged in, please close the window");
                        window.close();
                    }} else {{
                        document.write("Oh no! Something went wrong! There's not much we can do at this point. :-( ")
                    }}
                }})
                </script>
            </body>
        "#,
        url
    );
    let response = Response::new(StatusCode(200), vec![], page.as_bytes(), None, None);
    request.respond(response)?;

    Ok(())
}

fn handle_finish(request: Request, app_handle: &AppHandle<Wry>) -> anyhow::Result<()> {
    let full_url = request
        .headers()
        .iter()
        .find_map(|h| {
            h.field
                .equiv("x-full-url")
                .then(|| h.value.as_str().to_string())
        })
        .unwrap_or_default();
    let full_url = url::Url::parse(&full_url).unwrap();
    let access_token = access_token_from_request(&full_url);
    let response = if let Some(access_token) = access_token {
        events::dispatch(app_handle, &events::OAuthLoggedIn { access_token });
        Response::new(StatusCode(200), vec![], "OK".as_bytes(), None, None)
    } else {
        let message = get_access_token("error", full_url.query_pairs()).unwrap_or_default();

        events::dispatch(app_handle, &events::OAuthFailed { message });
        Response::new(StatusCode(404), vec![], "Not Found".as_bytes(), None, None)
    };

    request.respond(response)?;

    Ok(())
}


fn access_token_from_request(token_url: &url::Url) -> Option<String> {
    let query_pairs = token_url.query_pairs();
    let mut access_token = get_access_token("access_token", query_pairs);

    if access_token.is_none() {
        if let Some(fragment) = token_url.fragment() {
            let fragment_pairs = url::form_urlencoded::parse(fragment.as_bytes());
            access_token = get_access_token("access_token", fragment_pairs);
        }
    }

    access_token
}

fn get_access_token(needle: &str, pairs: Parse<'_>) -> Option<String> {
    for (key, value) in pairs {
        if key == needle {
            return Some(value.to_string());
        }
    }
    None
}
