// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_log::LogTarget;

use crate::state::OauthState;

mod oauth;
mod state;
mod events;
mod constants;
mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().targets([LogTarget::Stdout]).build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet, oauth::start_login, commands::get_environment_variable])
        .manage(OauthState::default())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
