//! Handlers #[tauri::command] finos: Simulador de créditos (REQ-15).
//! Sandbox puro: no reciben `State` ni tocan el repositorio; calculan
//! sobre hipótesis y jamás alteran los pasivos reales del balance.

use crate::application::simulador_creditos::comparador::simular_comparada;
use crate::application::simulador_creditos::estrategia::simular_plan_creditos;
use crate::application::simulador_creditos::validacion::validar_credito;
use crate::application::simulador_creditos::{
    PlanCreditosSimulados, PeticionPlanCreditos, PeticionSimulacion, SimulacionComparada,
};
use crate::commands::error::CommandError;

/// REQ-15-01/02/04/05: cuota, intereses, amortización y comparación
/// base vs optimizado de un crédito hipotético.
#[tauri::command]
pub fn simular_credito(
    peticion: PeticionSimulacion,
) -> Result<SimulacionComparada, CommandError> {
    simular_comparada(&peticion).map_err(CommandError::from)
}

/// REQ-15-03: avalancha y bola de nieve sobre varios créditos simulados
/// reutilizando el motor del plan de deuda.
#[tauri::command]
pub fn simular_plan_creditos_cmd(
    peticion: PeticionPlanCreditos,
) -> Result<PlanCreditosSimulados, CommandError> {
    for credito in &peticion.creditos {
        validar_credito(credito).map_err(CommandError::from)?;
    }
    simular_plan_creditos(&peticion.creditos, peticion.extra_mensual)
        .map_err(CommandError::from)
}
