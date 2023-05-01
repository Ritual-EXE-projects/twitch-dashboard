#[tauri::command]
pub fn get_environment_variable(name: &str, fallback: &str) -> String {
    return std::env::var(name).unwrap_or(fallback.to_string());
}
