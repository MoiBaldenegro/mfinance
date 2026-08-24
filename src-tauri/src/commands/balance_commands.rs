//! Handlers #[tauri::command] finos: Balance serie y CRUD de
//! activos/pasivos (REQ-32-01..04). Delegan en application/ sin lógica
//! de negocio ni acceso directo al filesystem.

use tauri::State;

use crate::application::balance_crud;
use crate::application::balance_crud_error::BalanceCrudError;
use crate::application::balance_serie::{balance_serie as motor_balance, BalanceCompleto};
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

/// Convierte el error del CRUD en CommandError conservando su nombre.
fn error_command(error: BalanceCrudError) -> CommandError {
    match &error {
        BalanceCrudError::ValorNegativo(e) => {
            CommandError::nueva(error.codigo(), e)
        }
        _ => CommandError {
            codigo: error.codigo().to_string(),
            mensaje: error.to_string(),
        },
    }
}

/// REQ-08-03/05: balance completo (totales + serie mensual) sobre el snapshot vigente.
#[tauri::command]
pub fn balance_serie(state: State<AppState>) -> Result<BalanceCompleto, CommandError> {
    let repo = locked(&state)?;
    motor_balance(&*repo).map_err(CommandError::from)
}

/// REQ-32-01/02: inserta o edita un activo del snapshot del perfil activo.
#[tauri::command]
pub fn asset_upsert(
    nombre: String,
    categoria: String,
    valor_actual: f64,
    state: State<AppState>,
) -> Result<FinanceSnapshot, CommandError> {
    let mut repo = locked(&state)?;
    balance_crud::asset_upsert(&mut *repo, &nombre, &categoria, valor_actual)
        .map_err(error_command)
}

/// REQ-32-03: elimina el activo con ese nombre del perfil activo.
#[tauri::command]
pub fn asset_eliminar(
    nombre: String,
    state: State<AppState>,
) -> Result<FinanceSnapshot, CommandError> {
    let mut repo = locked(&state)?;
    balance_crud::asset_eliminar(&mut *repo, &nombre).map_err(error_command)
}

/// REQ-32-01/02: inserta o edita un pasivo del snapshot del perfil activo.
#[tauri::command]
pub fn liability_upsert(
    nombre: String,
    saldo_pendiente: f64,
    tasa_interes_anual: f64,
    state: State<AppState>,
) -> Result<FinanceSnapshot, CommandError> {
    let mut repo = locked(&state)?;
    balance_crud::liability_upsert(
        &mut *repo,
        &nombre,
        saldo_pendiente,
        tasa_interes_anual,
    )
    .map_err(error_command)
}

/// REQ-32-03: elimina el pasivo con ese nombre del perfil activo.
#[tauri::command]
pub fn liability_eliminar(
    nombre: String,
    state: State<AppState>,
) -> Result<FinanceSnapshot, CommandError> {
    let mut repo = locked(&state)?;
    balance_crud::liability_eliminar(&mut *repo, &nombre).map_err(error_command)
}
