//! Doble en memoria del puerto SnapshotRepository (sin fs, sin red).

use crate::domain::repository::{
    SnapshotExportError, SnapshotImportError, SnapshotLoadError,
    SnapshotRepository, SnapshotSaveError,
};
use crate::domain::snapshot::FinanceSnapshot;

/// Punto de fallo inyectable para probar cada error nombrado del puerto.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FailPoint {
    Load,
    Save,
    Export,
    Import,
}


/// Fake que guarda dos ranuras: `stored` (load/save) y `exported`
/// (export/import), simulando el archivo vivo y la copia exportada.
#[derive(Default)]
pub struct FakeSnapshotRepository {
    pub stored: Option<FinanceSnapshot>,
    pub exported: Option<FinanceSnapshot>,
    pub fail_point: Option<FailPoint>,
}

impl FakeSnapshotRepository {
    pub fn new() -> Self {
        Self::default()
    }

    fn failing(&self, point: &FailPoint) -> bool {
        self.fail_point.as_ref() == Some(point)
    }
}

impl SnapshotRepository for FakeSnapshotRepository {
    fn load(&self) -> Result<FinanceSnapshot, SnapshotLoadError> {
        if self.failing(&FailPoint::Load) {
            return Err(SnapshotLoadError::new("fallo inyectado"));
        }
        self.stored
            .clone()
            .ok_or_else(|| SnapshotLoadError::new("sin snapshot almacenado"))
    }

    fn save(
        &mut self,
        snapshot: &FinanceSnapshot,
    ) -> Result<(), SnapshotSaveError> {
        if self.failing(&FailPoint::Save) {
            return Err(SnapshotSaveError::new("fallo inyectado"));
        }
        self.stored = Some(snapshot.clone());
        Ok(())
    }

    fn export(
        &mut self,
        snapshot: &FinanceSnapshot,
    ) -> Result<(), SnapshotExportError> {
        if self.failing(&FailPoint::Export) {
            return Err(SnapshotExportError::new("fallo inyectado"));
        }
        self.exported = Some(snapshot.clone());
        Ok(())
    }

    fn import(&self) -> Result<FinanceSnapshot, SnapshotImportError> {
        if self.failing(&FailPoint::Import) {
            return Err(SnapshotImportError::new("fallo inyectado"));
        }
        self.exported
            .clone()
            .ok_or_else(|| SnapshotImportError::new("no hay copia exportada"))
    }
}
