//! Caso de uso import_json (REQ-04-05/06): restaura el vigente desde la
//! copia elegida validando invariantes antes de persistir; si algo falla
//! los datos vigentes quedan intactos.

use crate::application::import_validation;
use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::{SnapshotImportError, SnapshotSaveError};
use crate::domain::snapshot::FinanceSnapshot;

/// Importa la copia externa: valida el esquema y las invariantes del
/// dominio, persiste el resultado como vigente (REQ-04-05) y lo devuelve.
pub fn import_json(
    repository: &mut dyn SnapshotRepository,
) -> Result<FinanceSnapshot, SnapshotImportError> {
    let raw = repository.import()?;
    let validated = import_validation::rebuild(raw)?;
    repository.save(&validated).map_err(persist_error)?;
    Ok(validated)
}

/// Un snapshot validado que no pudo guardarse es también un fallo de la
/// operación de importación (una sola variante nombrada por caso de uso).
fn persist_error(error: SnapshotSaveError) -> SnapshotImportError {
    SnapshotImportError::new(&format!(
        "validado pero no persistido: {error}"
    ))
}
