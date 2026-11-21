use serde_json::{json, Value};
use std::sync::Mutex;
use std::{
    collections::VecDeque,
    fs,
    fs::OpenOptions,
    io::Write,
    path::{Component, Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
    time::Duration,
};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

#[derive(Default)]
pub struct AgentProject {
    root: Mutex<Option<PathBuf>>,
}

static TEMP_FILE_ID: AtomicU64 = AtomicU64::new(0);

fn selected_project(app: &AppHandle) -> Result<PathBuf, String> {
    app.state::<AgentProject>()
        .root
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "Choose a project folder first".to_string())
}

fn project_path(root: &str, relative: &str) -> Result<PathBuf, String> {
    let root = fs::canonicalize(root).map_err(|e| format!("Invalid project folder: {e}"))?;
    let rel = Path::new(relative);
    if rel.as_os_str().is_empty() || rel.components().any(|c| !matches!(c, Component::Normal(_))) {
        return Err("Use a project-relative file path without . or .. segments".into());
    }
    let candidate = root.join(rel);
    if candidate.exists() {
        let canonical = fs::canonicalize(&candidate).map_err(|e| e.to_string())?;
        if !canonical.starts_with(&root) {
            return Err("Path resolves outside the selected project".into());
        }
        Ok(canonical)
    } else {
        let parent = candidate.parent().ok_or("Invalid file path")?;
        let parent =
            fs::canonicalize(parent).map_err(|e| format!("Parent folder must exist: {e}"))?;
        if !parent.starts_with(&root) {
            return Err("Path resolves outside the selected project".into());
        }
        Ok(candidate)
    }
}

#[tauri::command]
pub async fn agent_choose_project(app: AppHandle) -> Option<String> {
    let path = app
        .dialog()
        .file()
        .blocking_pick_folder()
        .and_then(|p| p.as_path().map(Path::to_path_buf))?;
    let root = fs::canonicalize(path).ok()?;
    *app.state::<AgentProject>().root.lock().unwrap() = Some(root.clone());
    Some(root.to_string_lossy().into_owned())
}

#[tauri::command]
pub async fn agent_capture_current_page(
    app: AppHandle,
) -> Result<crate::views::CapturedPage, String> {
    crate::views::capture_current_page(&app).await
}

#[tauri::command]
pub async fn agent_list_files(app: AppHandle) -> Result<Vec<String>, String> {
    let root = selected_project(&app)?;
    let root = fs::canonicalize(root).map_err(|e| e.to_string())?;
    let mut queue = VecDeque::from([(root.clone(), 0usize)]);
    let mut files = Vec::new();
    while let Some((dir, depth)) = queue.pop_front() {
        if depth > 5 {
            continue;
        }
        let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.')
                || matches!(
                    name.as_str(),
                    "node_modules" | "target" | "dist" | "build" | "vendor"
                )
            {
                continue;
            }
            let path = entry.path();
            let meta = match fs::symlink_metadata(&path) {
                Ok(m) => m,
                Err(_) => continue,
            };
            if meta.file_type().is_symlink() {
                continue;
            }
            if meta.is_dir() {
                queue.push_back((path, depth + 1));
            } else if meta.is_file() && meta.len() <= 512_000 {
                if let Ok(rel) = path.strip_prefix(&root) {
                    files.push(rel.to_string_lossy().replace('\\', "/"));
                }
            }
            if files.len() >= 400 {
                return Ok(files);
            }
        }
    }
    Ok(files)
}

#[tauri::command]
pub async fn agent_read_file(app: AppHandle, path: String) -> Result<String, String> {
    let root = selected_project(&app)?;
    let file = project_path(root.to_str().ok_or("Invalid selected project path")?, &path)?;
    let metadata = fs::metadata(&file).map_err(|e| e.to_string())?;
    if !metadata.is_file() || metadata.len() > 256_000 {
        return Err("File is not regular or exceeds the 256 KB read limit".into());
    }
    fs::read_to_string(file).map_err(|e| format!("File is not readable UTF-8: {e}"))
}

#[tauri::command]
pub async fn agent_write_file(app: AppHandle, path: String, content: String) -> Result<(), String> {
    if content.len() > 512_000 {
        return Err("File exceeds the 512 KB write limit".into());
    }
    let root = selected_project(&app)?;
    let file = project_path(root.to_str().ok_or("Invalid selected project path")?, &path)?;
    if let Some(parent) = file.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let parent = file.parent().ok_or("Invalid file path")?;
    let temp = (0..10)
        .find_map(|_| {
            let id = TEMP_FILE_ID.fetch_add(1, Ordering::Relaxed);
            let candidate = parent.join(format!(".marz-agent-{}-{id}.tmp", std::process::id()));
            match OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&candidate)
            {
                Ok(mut handle) => match handle.write_all(content.as_bytes()) {
                    Ok(()) => Some(Ok(candidate)),
                    Err(error) => {
                        drop(handle);
                        let _ = fs::remove_file(&candidate);
                        Some(Err(error))
                    }
                },
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => None,
                Err(error) => Some(Err(error)),
            }
        })
        .ok_or_else(|| "Unable to create a unique temporary file".to_string())?
        .map_err(|e| e.to_string())?;
    fs::rename(&temp, &file).map_err(|e| {
        let _ = fs::remove_file(&temp);
        e.to_string()
    })
}

#[tauri::command]
pub async fn agent_chat(
    endpoint: String,
    model: String,
    api_key: Option<String>,
    messages: Vec<Value>,
    tools: Vec<Value>,
) -> Result<Value, String> {
    if endpoint.len() > 1024 || model.trim().is_empty() || model.len() > 200 {
        return Err("Endpoint or model is invalid".into());
    }
    let mut base = url::Url::parse(&endpoint).map_err(|e| format!("Invalid endpoint URL: {e}"))?;
    if !matches!(base.scheme(), "http" | "https")
        || base.host_str().is_none()
        || base.username() != ""
        || base.password().is_some()
        || base.fragment().is_some()
    {
        return Err("Use an HTTP(S) endpoint without embedded credentials or fragments".into());
    }
    let path = base.path().trim_end_matches('/').to_owned();
    base.set_path(&format!("{path}/chat/completions"));
    base.set_query(None);
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(90))
        .build()
        .map_err(|e| e.to_string())?;
    let mut req = client.post(base).json(&json!({"model":model,"messages":messages,"tools":tools,"tool_choice":"auto","parallel_tool_calls":false}));
    if let Some(key) = api_key.filter(|k| !k.trim().is_empty()) {
        req = req.bearer_auth(key);
    }
    let mut response = req
        .send()
        .await
        .map_err(|e| format!("Provider request failed: {e}"))?;
    let status = response.status();
    if response
        .content_length()
        .is_some_and(|length| length > 5_000_000)
    {
        return Err("Provider response exceeded 5 MB".into());
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        if bytes.len() + chunk.len() > 5_000_000 {
            return Err("Provider response exceeded 5 MB".into());
        }
        bytes.extend_from_slice(&chunk);
    }
    if !status.is_success() {
        return Err(format!(
            "Provider returned {status}: {}",
            String::from_utf8_lossy(&bytes[..bytes.len().min(1000)])
        ));
    }
    serde_json::from_slice(&bytes).map_err(|e| format!("Provider returned invalid JSON: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn project_paths_reject_parent_traversal() {
        let root = std::env::temp_dir().join(format!("marz-agent-test-{}", std::process::id()));
        fs::create_dir_all(&root).unwrap();
        assert!(project_path(root.to_str().unwrap(), "../outside.txt").is_err());
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn project_paths_accept_relative_files() {
        let root = std::env::temp_dir().join(format!("marz-agent-test-{}", std::process::id()));
        fs::create_dir_all(&root).unwrap();
        fs::write(root.join("inside.txt"), "ok").unwrap();
        assert!(project_path(root.to_str().unwrap(), "inside.txt").is_ok());
        let _ = fs::remove_dir_all(root);
    }
}
