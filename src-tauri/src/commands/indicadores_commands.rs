//! Handlers #[tauri::command] finos: Indicadores semáforo.

use tauri::State;

use crate::application::indicadores_fachada::{indicadores as motor_indicadores};
use crate::application::indicadores_types::Indicadores;
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

type LockedRepo<'a> = std::sync::MutexGuard<'a, JsonSnapshotRepository>;

fn locked(state: &AppState) -> Result<LockedRepo<'_>, CommandError> {
    state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })
}

/// REQ-10-01..05: indicadores semáforo (endeudamiento, tasa ahorro, fondo emergencia, ingreso pasivo).
#[tauri::command]
pub fn indicadores(state: State<AppState>) -> Result<Indicadores, CommandError> {
    let repo = locked(&state)?;
    motor_indicadores(&*repo).map_err(CommandError::from)
}