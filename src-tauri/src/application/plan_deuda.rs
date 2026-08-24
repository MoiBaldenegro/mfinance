//! REQ-09-01/02/03: caso de uso que calcula el plan de deuda
//! (orden avalancha/bola de nieve, proyección mes a mes con interés
//! compuesto mensual y métricas de intereses ahorrados).
//! Puro: sin fs ni framework de escritorio; el command fino lo expone por IPC.

pub use crate::application::plan_deuda_simulacion::{
    calcular_plan_deuda as motor_calcular,
    orden_avalancha,
    orden_bola_nieve,
    PlanDeuda,
};

use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotLoadError;
use crate::domain::snapshot::FinanceSnapshot;

/// Motor puro del plan de deuda: calcula todo sobre un snapshot cualquiera.
pub fn calcular_plan_deuda(snapshot: &FinanceSnapshot) -> PlanDeuda {
    motor_calcular(snapshot)
}

/// Calcula el plan de deuda del estado vigente delegando la carga en el puerto.
pub fn plan_deuda(
    repository: &dyn SnapshotRepository,
) -> Result<PlanDeuda, SnapshotLoadError> {
    let snapshot = repository.load()?;
    Ok(calcular_plan_deuda(&snapshot))
}