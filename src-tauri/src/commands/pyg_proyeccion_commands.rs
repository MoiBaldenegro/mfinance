//! Handlers #[tauri::command] finos: Proyección PyG 12 meses y balance futuro.

use tauri::State;

use crate::application::pyg_proyeccion::{
    proyeccion_pyg as motor_pyg_proyeccion, balance_futuro as motor_balance_futuro,
    ProyeccionPyg, BalanceFuturo, SupuestosProyeccion,
};
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

type LockedRepo<'a> = std::sync::MutexGuard<'a, JsonSnapshotRepository>;

fn locked(state: &AppState) -> Result<LockedRepo<'_>, CommandError> {
    state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })
}

/// REQ-14-01: proyección PyG 12 meses con supuestos editables.
#[tauri::command]
pub fn pyg_proyeccion(
    state: State<AppState>,
    supuestos: SupuestosProyeccion,
) -> Result<ProyeccionPyg, CommandError> {
    let repo = locked(&state)?;
    motor_pyg_proyeccion(&*repo, &supuestos).map_err(CommandError::from)
}

/// REQ-14-02: balance futuro 12 meses con amortización de pasivos.
#[tauri::command]
pub fn balance_futuro(
    state: State<AppState>,
    supuestos: SupuestosProyeccion,
) -> Result<BalanceFuturo, CommandError> {
    let repo = locked(&state)?;
    motor_balance_futuro(&*repo, &supuestos).map_err(CommandError::from)
}