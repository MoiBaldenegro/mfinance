//! REQ-04-01 + REQ-21-02/03: adapter JSON del puerto SnapshotRepository
//! consciente de perfiles. La ruta del estado se resuelve según el
//! perfil activo (`<base>/perfiles/<id>/mfinance.json`), así load/save/
//! export/import conservan su firma IPC original operando SOLO sobre el
//! perfil activo. La base es INYECTABLE (tests: directorios temporales;
//! composition root: Documents/mfinance) y la ranura de transferencia
//! la fija la capa de entrada antes de exportar o importar.

use std::path::PathBuf;

use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::{
    SnapshotExportError, SnapshotImportError, SnapshotLoadError,
    SnapshotSaveError,
};
use crate::domain::snapshot::FinanceSnapshot;
use crate::infrastructure::json_file;
use crate::infrastructure::rutas_mfinance;

const SIN_ACTIVO: &str = "sin perfil activo no hay snapshot que operar";

/// Adapter de persistencia JSON por perfil: resuelve el estado vigente
/// dentro de la carpeta del perfil activo y guarda la ruta elegida por
/// el usuario para las transferencias (export/import).
pub struct JsonSnapshotRepository {
    pub(crate) base: PathBuf,
    pub(crate) activo: Option<String>,
    pub(crate) transfer_path: Option<PathBuf>,
}

impl JsonSnapshotRepository {
    /// Construye el adapter con la carpeta base inyectada desde fuera.
    pub fn new(base_dir: PathBuf) -> Self {
        Self { base: base_dir, activo: None, transfer_path: None }
    }

    /// Id del perfil activo en memoria (tras cargar/guardar registro).
    pub fn activo(&self) -> Option<&str> {
        self.activo.as_deref()
    }

    /// Ruta del archivo de estado del perfil activo, si lo hay.
    pub fn state_path(&self) -> Option<PathBuf> {
        self.activo
            .as_ref()
            .map(|id| rutas_mfinance::snapshot_de(&self.base, id))
    }

    /// Fija la ruta elegida por el usuario para exportar o importar.
    pub fn set_transfer_path(&mut self, path: PathBuf) {
        self.transfer_path = Some(path);
    }

    fn ruta_activa(&self) -> Result<PathBuf, String> {
        self.state_path().ok_or_else(|| SIN_ACTIVO.to_string())
    }
}

impl SnapshotRepository for JsonSnapshotRepository {
    fn load(&self) -> Result<FinanceSnapshot, SnapshotLoadError> {
        let ruta =
            self.ruta_activa().map_err(|m| SnapshotLoadError::new(&m))?;
        json_file::read(&ruta)
            .map_err(|reason| SnapshotLoadError::new(&reason))
    }

    fn save(
        &mut self,
        snapshot: &FinanceSnapshot,
    ) -> Result<(), SnapshotSaveError> {
        let ruta =
            self.ruta_activa().map_err(|m| SnapshotSaveError::new(&m))?;
        json_file::write_atomic(&ruta, snapshot)
            .map_err(|reason| SnapshotSaveError::new(&reason))
    }

    fn export(
        &mut self,
        snapshot: &FinanceSnapshot,
    ) -> Result<(), SnapshotExportError> {
        let destination = self.transfer_path.as_ref().ok_or_else(|| {
            SnapshotExportError::new(
                "sin ruta de destino elegida por el usuario",
            )
        })?;
        json_file::write_atomic(destination, snapshot)
            .map_err(|reason| SnapshotExportError::new(&reason))
    }

    fn import(&self) -> Result<FinanceSnapshot, SnapshotImportError> {
        let origin = self.transfer_path.as_ref().ok_or_else(|| {
            SnapshotImportError::new("sin ruta de origen elegida por el usuario")
        })?;
        json_file::read(origin)
            .map_err(|reason| SnapshotImportError::new(&reason))
    }
}
