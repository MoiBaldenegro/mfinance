//! Doble en memoria mínimo del puerto SnapshotRepository: dos ranuras
//! (`stored`/`exported`) y fallos inyectables para load y save.

use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::{
    SnapshotExportError, SnapshotImportError, SnapshotLoadError,
    SnapshotSaveError,
};
use crate::domain::snapshot::FinanceSnapshot;

#[derive(Default)]
pub struct MemoryRepository {
    pub stored: Option<FinanceSnapshot>,
    pub exported: Option<FinanceSnapshot>,
    pub fail_load: bool,
    pub fail_save: bool,
}

impl SnapshotRepository for MemoryRepository {
    fn load(&self) -> Result<FinanceSnapshot, SnapshotLoadError> {
        if self.fail_load {
            return Err(SnapshotLoadError::new("fallo inyectado"));
        }
        self.stored
            .clone()
            .ok_or_else(|| SnapshotLoadError::new("sin datos"))
    }

    fn save(
        &mut self,
        snapshot: &FinanceSnapshot,
    ) -> Result<(), SnapshotSaveError> {
        if self.fail_save {
            return Err(SnapshotSaveError::new("fallo inyectado"));
        }
        self.stored = Some(snapshot.clone());
        Ok(())
    }

    fn export(
        &mut self,
        snapshot: &FinanceSnapshot,
    ) -> Result<(), SnapshotExportError> {
        self.exported = Some(snapshot.clone());
        Ok(())
    }

    fn import(&self) -> Result<FinanceSnapshot, SnapshotImportError> {
        self.exported
            .clone()
            .ok_or_else(|| SnapshotImportError::new("sin copia"))
    }
}
