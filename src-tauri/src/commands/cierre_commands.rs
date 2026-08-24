//! Handlers #[tauri::command] finos: Cierre mensual guiado.

use tauri::State;

use crate::application::cierre::fachada::{consejos_vigentes, resumen_cierre};
use crate::application::cierre::peticion::PeticionCierre;
use crate::application::cierre::tipos::ResumenCierre;
use crate::application::cierre::{cerrar_mes, reabrir_mes};
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

/// REQ-16-01/02: resumen del wizard para el mes que se cierra.
#[tauri::command]
pub fn cierre_resumen_cmd(
    mes: String,
    state: State<AppState>,
) -> Result<ResumenCierre, CommandError> {
    let repo = locked(&state)?;
    resumen_cierre(&*repo, &mes).map_err(CommandError::from)
}

/// REQ-16-03/08: confirma el cierre persistiendo el assessment del mes.
#[tauri::command]
pub fn cierre_confirmar_cmd(
    peticion: PeticionCierre,
    state: State<AppState>,
) -> Result<FinanceSnapshot, CommandError> {
    let mut repo = locked(&state)?;
    cerrar_mes(&mut *repo, &peticion).map_err(CommandError::from)
}

/// REQ-16-07: reapertura explícita de un mes cerrado.
#[tauri::command]
pub fn cierre_reabrir_cmd(
    mes: String,
    state: State<AppState>,
) -> Result<FinanceSnapshot, CommandError> {
    let mut repo = locked(&state)?;
    reabrir_mes(&mut *repo, &mes).map_err(CommandError::from)
}

/// REQ-16-04/05: recomendaciones vigentes recalculadas sobre los datos.
#[tauri::command]
pub fn consejos_cmd(state: State<AppState>) -> Result<Vec<crate::application::cierre::Recomendacion>, CommandError> {
    let repo = locked(&state)?;
    consejos_vigentes(&*repo).map_err(CommandError::from)
}
