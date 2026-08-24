//! Handlers #[tauri::command] finos: Inversiones proyección.

use tauri::State;

use crate::application::inversiones_proyeccion::{inversiones_proyeccion, ProyeccionInversiones};
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

type LockedRepo<'a> = std::sync::MutexGuard<'a, JsonSnapshotRepository>;

fn locked(state: &AppState) -> Result<LockedRepo<'_>, CommandError> {
    state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })
}

/// REQ-11-02: proyección de inversiones a 5/10/20 años con interés compuesto.
#[tauri::command]
pub fn inversiones_proyeccion_cmd(state: State<AppState>) -> Result<ProyeccionInversiones, CommandError> {
    let repo = locked(&state)?;
    inversiones_proyeccion(&*repo).map_err(CommandError::from)
}