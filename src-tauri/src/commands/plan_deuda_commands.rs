//! Handlers #[tauri::command] finos: Plan de deuda.

use tauri::State;

use crate::application::plan_deuda::{plan_deuda as motor_plan, PlanDeuda};
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

type LockedRepo<'a> = std::sync::MutexGuard<'a, JsonSnapshotRepository>;

fn locked(state: &AppState) -> Result<LockedRepo<'_>, CommandError> {
    state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })
}

/// REQ-09-01/02/03: plan de deuda (orden avalancha/bola, proyección, métricas).
#[tauri::command]
pub fn plan_deuda(state: State<AppState>) -> Result<PlanDeuda, CommandError> {
    let repo = locked(&state)?;
    motor_plan(&*repo).map_err(CommandError::from)
}