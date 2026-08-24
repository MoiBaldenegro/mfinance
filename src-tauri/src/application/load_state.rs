//! Caso de uso load_state: recupera el snapshot vigente vía el puerto
//! inyectado, sin conocer detalles de fs ni IPC.

use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotLoadError;
use crate::domain::snapshot::FinanceSnapshot;

/// Devuelve el estado vigente delegando en el puerto.
pub fn load_state(
    repository: &dyn SnapshotRepository,
) -> Result<FinanceSnapshot, SnapshotLoadError> {
    repository.load()
}
