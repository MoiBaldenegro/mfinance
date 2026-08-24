//! Handlers #[tauri::command] finos (REQ-04-08): core snapshot — load/save/export/import.
//! Delegan en application/ sin lógica de negocio ni acceso directo al filesystem.
//! Las rutas de export/import llegan como parámetro String (el frontend las obtiene
//! con su API de diálogos o un input) y se fijan en el adapter antes de delegar.

use tauri::State;

use crate::application::export_json;
use crate::application::import_json;
use crate::application::load_state;
use crate::application::save_state;
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::domain::snapshot::FinanceSnapshot;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

type LockedRepo<'a> = std::sync::MutexGuard<'a, JsonSnapshotRepository>;

fn locked(state: &AppState) -> Result<LockedRepo<'_>, CommandError> {
    state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })
}

/// Recupera el snapshot vigente.
#[tauri::command]
pub fn load_state(
    state: State<AppState>,
) -> Result<FinanceSnapshot, CommandError> {
    let repo = locked(&state)?;
    load_state::load_state(&*repo).map_err(CommandError::from)
}

/// Persiste el snapshot recibido como estado vigente.
#[tauri::command]
pub fn save_state(
    snapshot: FinanceSnapshot,
    state: State<AppState>,
) -> Result<(), CommandError> {
    let mut repo = locked(&state)?;
    save_state::save_state(&mut *repo, &snapshot).map_err(CommandError::from)
}

/// Copia el JSON vigente a `destination` y devuelve la ruta escrita.
#[tauri::command]
pub fn export_json(
    destination: String,
    state: State<AppState>,
) -> Result<String, CommandError> {
    let mut repo = locked(&state)?;
    repo.set_transfer_path(destination.clone().into());
    export_json::export_current(&mut *repo).map_err(CommandError::from)?;
    Ok(destination)
}

/// Restaura el vigente desde `origin` y devuelve el snapshot importado.
#[tauri::command]
pub fn import_json(
    origin: String,
    state: State<AppState>,
) -> Result<FinanceSnapshot, CommandError> {
    let mut repo = locked(&state)?;
    repo.set_transfer_path(origin.into());
    import_json::import_json(&mut *repo).map_err(CommandError::from)
}