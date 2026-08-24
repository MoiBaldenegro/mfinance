//! Doble combinado (PerfilRepository + SnapshotRepository): la misma
//! forma que exige preparar_arranque al adapter real, delegando en los
//! dos dobles simples de esta carpeta. Fiel al adapter REAL: un save
//! (o adopción del legado) crea el snapshot del perfil ACTIVO, así el
//! campo «activo» queda modelado y la autorecuperación es probable.

use super::memory_perfil_repository::MemoryPerfilRepository;
use super::memory_repository::MemoryRepository;
use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::registro_perfiles::RegistroPerfiles;
use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::{
    SnapshotExportError, SnapshotImportError, SnapshotLoadError,
    SnapshotSaveError,
};
use crate::domain::snapshot::FinanceSnapshot;

/// Doble del almacén completo para probar preparar_arranque.
#[derive(Default)]
pub struct MemoryStorePerfiles {
    pub perfiles: MemoryPerfilRepository,
    pub snapshots: MemoryRepository,
}

impl MemoryStorePerfiles {
    /// El adapter real acaba de escribir el snapshot de ese perfil.
    fn marcar_snapshot_presente(&mut self, id: &str) {
        if !self.perfiles.tiene_snapshot(id) {
            self.perfiles.snapshots_presentes.push(id.to_string());
        }
    }
}

impl PerfilRepository for MemoryStorePerfiles {
    fn cargar_registro(
        &mut self,
    ) -> Result<Option<RegistroPerfiles>, PerfilError> {
        self.perfiles.cargar_registro()
    }

    fn guardar_registro(
        &mut self,
        registro: &RegistroPerfiles,
    ) -> Result<(), PerfilError> {
        self.perfiles.guardar_registro(registro)
    }

    fn tiene_snapshot(&self, perfil_id: &str) -> bool {
        self.perfiles.tiene_snapshot(perfil_id)
    }

    fn legacy_pendiente(&self) -> bool {
        self.perfiles.legacy_pendiente()
    }

    fn adoptar_legacy(&mut self, destino: &Perfil) -> Result<(), PerfilError> {
        let resultado = self.perfiles.adoptar_legacy(destino);
        if resultado.is_ok() {
            self.marcar_snapshot_presente(&destino.id);
        }
        resultado
    }
}

impl SnapshotRepository for MemoryStorePerfiles {
    fn load(&self) -> Result<FinanceSnapshot, SnapshotLoadError> {
        self.snapshots.load()
    }

    fn save(
        &mut self,
        snapshot: &FinanceSnapshot,
    ) -> Result<(), SnapshotSaveError> {
        let resultado = self.snapshots.save(snapshot);
        if resultado.is_ok() {
            // El adapter real escribe el archivo del perfil ACTIVO.
            if let Some(activo) =
                self.perfiles.registro.as_ref().and_then(|r| r.activa.clone())
            {
                self.marcar_snapshot_presente(&activo);
            }
        }
        resultado
    }

    fn export(
        &mut self,
        snapshot: &FinanceSnapshot,
    ) -> Result<(), SnapshotExportError> {
        self.snapshots.export(snapshot)
    }

    fn import(&self) -> Result<FinanceSnapshot, SnapshotImportError> {
        self.snapshots.import()
    }
}
