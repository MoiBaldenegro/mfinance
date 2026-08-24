//! Soporte de los tests del CRUD de balance (REQ-32-01..04):
//! almacén real sobre directorio temporal, nunca Documents (REQ-04-09).

use std::path::{Path, PathBuf};

use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;
use crate::infrastructure::json_repository::JsonSnapshotRepository;
use crate::infrastructure::test_support::{store_con_perfil, temp_dir};

const PERFIL: &str = "perfil_f32";

/// Almacén con perfil activo y snapshot inicial vacío ya persistido.
pub fn repo_con_snapshot(tag: &str) -> (JsonSnapshotRepository, PathBuf) {
    let base = temp_dir(tag);
    let mut repo = store_con_perfil(&base, PERFIL);
    repo.save(&FinanceSnapshot::new()).expect("snapshot inicial");
    (repo, base)
}

/// Relee el snapshot persistido desde una instancia NUEVA del adapter
/// (round-trip real: restaura el activo del registro antes de cargar).
pub fn releer(base: &Path) -> FinanceSnapshot {
    let mut repo = JsonSnapshotRepository::new(base.to_path_buf());
    repo.cargar_registro()
        .expect("registro legible")
        .expect("perfil activo registrado");
    repo.load().expect("snapshot persistido")
}

/// Borrado best-effort del directorio temporal al terminar el test.
pub fn limpiar(base: &Path) {
    crate::infrastructure::test_support::cleanup(base);
}
