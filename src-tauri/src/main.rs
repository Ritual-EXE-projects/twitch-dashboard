// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::TcpListener;

use actix_web::{App, get, HttpResponse, HttpServer, Responder};
use tauri::{Manager, State};

pub struct AppState {
    pub port: Option<u16>,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_port(app: State<AppState>) -> u16 {
    app.port.unwrap()
}

#[get("/twitch-redirect")]
async fn twitch_redirect() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            port: get_available_port()
        })
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![get_port])
        .setup(|app| {
            let state: &AppState = &app.state();
            println!("Listening on port: {}", state.port.unwrap());

            tauri::async_runtime::spawn(
                HttpServer::new(|| {
                    App::new().service(twitch_redirect)
                }).bind(("127.0.0.1", state.port.unwrap()))?.run()
            );
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn get_available_port() -> Option<u16> {
    (8000..9000)
        .find(|port| port_is_available(*port))
}

fn port_is_available(port: u16) -> bool {
    match TcpListener::bind(("127.0.0.1", port)) {
        Ok(_) => true,
        Err(_) => false,
    }
}
