//! Tests REQ-04-04/05: export copia el vigente a la ranura elegida e
//! import reemplaza y persiste el snapshot restaurado.

use super::memory_repository::MemoryRepository;
use crate::application::{export_json, import_json};
use crate::domain::repository_errors::SnapshotExportError;
use crate::seed;

#[test]
fn export_json_copies_into_the_export_slot() {
    let mut repo = MemoryRepository::default();
    let snapshot = seed::example_snapshot();
    export_json::export_json(&mut repo, &snapshot).expect("exporta");
    assert_eq!(repo.exported, Some(snapshot));
}

#[test]
fn export_current_exports_exactly_the_stored_snapshot() {
    let mut repo = MemoryRepository::default();
    let snapshot = seed::example_snapshot();
    repo.stored = Some(snapshot.clone());
    let exported =
        export_json::export_current(&mut repo).expect("exporta vigente");
    assert_eq!(exported, snapshot);
    assert_eq!(repo.exported, Some(snapshot), "lo exportado es el vigente");
}

#[test]
fn export_current_wraps_a_missing_state_as_named_export_error() {
    let mut repo = MemoryRepository::default();
    let error = export_json::export_current(&mut repo)
        .expect_err("sin vigente no se puede exportar");
    assert!(matches!(error, SnapshotExportError { .. }));
}

#[test]
fn import_json_replaces_and_persists_the_current_state() {
    let mut repo = MemoryRepository::default();
    repo.stored = Some(seed::example_snapshot());
    let mut other = seed::example_snapshot();
    other.strategy.extra_monthly_payment = 300.0;
    repo.exported = Some(other.clone());

    let imported = import_json::import_json(&mut repo).expect("import feliz");
    assert_eq!(imported, other, "se devuelve lo importado");
    assert_eq!(repo.stored, Some(other), "el vigente queda reemplazado");
}
