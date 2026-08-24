//! REQ-03-06: trait-puerto SnapshotRepository con load, save, export e
//! import sobre FinanceSnapshot. Los adapters de infrastructure/ lo
//! implementan; dominio y casos de uso no conocen detalles de fs ni IPC.

pub use crate::domain::repository_errors::{
    SnapshotExportError, SnapshotImportError, SnapshotLoadError,
    SnapshotSaveError,
};
use crate::domain::snapshot::FinanceSnapshot;

/// Puerto de persistencia definido por el núcleo: cada operación fallible
/// devuelve su error nombrado propio (REQ-03-07).
pub trait SnapshotRepository {
    /// Recupera el snapshot vigente.
    fn load(&self) -> Result<FinanceSnapshot, SnapshotLoadError>;

    /// Persiste el snapshot como estado vigente.
    fn save(
        &mut self,
        snapshot: &FinanceSnapshot,
    ) -> Result<(), SnapshotSaveError>;

    /// Escribe una copia exportada independiente del estado vigente.
    fn export(
        &mut self,
        snapshot: &FinanceSnapshot,
    ) -> Result<(), SnapshotExportError>;

    /// Restaura un snapshot desde la copia exportada.
    fn import(&self) -> Result<FinanceSnapshot, SnapshotImportError>;
}
