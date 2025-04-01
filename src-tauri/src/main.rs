// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;
use tauri::generate_handler;

/// Saves a markdown file to the given path.
#[tauri::command]
fn save_note(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

/// Reads a markdown file from the given path.
#[tauri::command]
fn read_note(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Lists all markdown (`.md`) files in the given directory.
#[tauri::command]
fn list_notes(dir: String) -> Result<Vec<String>, String> {
    let mut notes = Vec::new();

    // Ensure the directory exists
    let path = Path::new(&dir);
    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }

    for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.path().extension().map_or(false, |ext| ext == "md") {
            notes.push(entry.path().to_string_lossy().into_owned());
        }
    }

    Ok(notes)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(generate_handler![save_note, read_note, list_notes])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
