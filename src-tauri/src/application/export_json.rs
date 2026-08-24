//! Caso de uso export_json (REQ-04-04): copia el JSON vigente a la ruta
//! elegida por el usuario. La ruta la fija la capa de entrada en el
//! adapter antes de delegar; aquí solo se orquesta vía puerto.

use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::{SnapshotExportError, SnapshotLoadError};
use crate::domain::snapshot::FinanceSnapshot;

/// Exporta el snapshot recibido a la ranura de transferencia del adapter.
pub fn export_json(
    repository: &mut dyn SnapshotRepository,
    snapshot: &FinanceSnapshot,
) -> Result<(), SnapshotExportError> {
    repository.export(snapshot)
}

/// Exporta el snapshot vigente leyéndolo primero vía puerto (REQ-04-04:
/// "copia del JSON vigente"). El fallo de lectura se envuelve en el error
/// nombrado de la operación para mantener una sola variante por caso de uso.
pub fn export_current(
    repository: &mut dyn SnapshotRepository,
) -> Result<FinanceSnapshot, SnapshotExportError> {
    let wrap = |error: SnapshotLoadError| {
        SnapshotExportError::new(&format!(
            "no se pudo leer el vigente para exportar: {error}"
        ))
    };
    let snapshot = repository.load().map_err(wrap)?;
    repository.export(&snapshot)?;
    Ok(snapshot)
}
