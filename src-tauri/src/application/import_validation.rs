//! REQ-04-06: orquestador de la revalidación al importar. Serde deriva
//! sin pasar por constructores, así que cada parte del agregado se
//! reconstruye con su constructor validado; cualquier violación produce
//! un SnapshotImportError y los datos vigentes quedan intactos.

use crate::application::entity_validation;
use crate::application::record_validation;
use crate::domain::repository_errors::SnapshotImportError;
use crate::domain::snapshot::FinanceSnapshot;

/// Motivo común para cualquier entidad reconstruida que falle.
pub(crate) fn rejected(
    contexto: &str,
    error: impl std::fmt::Display,
) -> SnapshotImportError {
    SnapshotImportError::new(&format!("esquema inválido ({contexto}): {error}"))
}

/// Reconstruye el agregado validando claves de mes y no negatividad.
/// Los estados de cuenta no tienen invariantes propias en el dominio
/// (REQ-03-04) y se conservan tal cual.
pub fn rebuild(
    raw: FinanceSnapshot,
) -> Result<FinanceSnapshot, SnapshotImportError> {
    Ok(FinanceSnapshot {
        monthly_records: record_validation::records(&raw)?,
        assets: entity_validation::assets(&raw)?,
        liabilities: entity_validation::liabilities(&raw)?,
        investments: entity_validation::investments(&raw)?,
        account_statements: raw.account_statements.clone(),
        strategy: raw.strategy,
        assessments: raw.assessments.clone(),
    })
}
