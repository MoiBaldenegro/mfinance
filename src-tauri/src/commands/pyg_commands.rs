//! Handlers #[tauri::command] finos: P&G serie mensual.

use tauri::State;

use crate::application::pyg_serie as motor_pyg;
use crate::application::pyg_serie::SeriePyg;
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

type LockedRepo<'a> = std::sync::MutexGuard<'a, JsonSnapshotRepository>;

fn locked(state: &AppState) -> Result<LockedRepo<'_>, CommandError> {
    state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })
}

/// REQ-07-01: serie mensual P&G calculada sobre el snapshot vigente.
#[tauri::command]
pub fn pyg_serie(state: State<AppState>) -> Result<SeriePyg, CommandError> {
    let repo = locked(&state)?;
    motor_pyg::pyg_serie(&*repo).map_err(CommandError::from)
}