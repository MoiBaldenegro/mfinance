//! Handlers #[tauri::command] finos: Conciliación de cuentas.

use tauri::State;

use crate::application::conciliacion::{agregar_movimiento, conciliacion_mensual, ConciliacionMensual, HistoricoConciliacion};
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::domain::account_statement::Movement;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

type LockedRepo<'a> = std::sync::MutexGuard<'a, JsonSnapshotRepository>;

fn locked(state: &AppState) -> Result<LockedRepo<'_>, CommandError> {
    state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })
}

/// REQ-13-01..07: conciliación mensual para un mes (YYYY-MM).
#[tauri::command]
pub fn conciliacion_mensual_cmd(
    mes: String,
    state: State<AppState>,
) -> Result<ConciliacionMensual, CommandError> {
    let repo = locked(&state)?;
    conciliacion_mensual(&*repo, &mes).map_err(CommandError::from)
}

/// REQ-13-05: agregar movimiento a una cuenta y recalcular.
#[tauri::command]
pub fn conciliacion_agregar_movimiento(
    mes: String,
    cuenta: String,
    movimiento: Movement,
    state: State<AppState>,
) -> Result<crate::domain::snapshot::FinanceSnapshot, CommandError> {
    let mut repo = locked(&state)?;
    agregar_movimiento(&mut *repo, &mes, &cuenta, movimiento).map_err(CommandError::from)
}

/// REQ-13-07: histórico mensual de conciliación.
#[tauri::command]
pub fn conciliacion_historico_cmd(
    state: State<AppState>,
) -> Result<HistoricoConciliacion, CommandError> {
    let repo = locked(&state)?;
    let snapshot = crate::application::load_state::load_state(&*repo).map_err(CommandError::from)?;
    Ok(HistoricoConciliacion::from_snapshot(&snapshot))
}