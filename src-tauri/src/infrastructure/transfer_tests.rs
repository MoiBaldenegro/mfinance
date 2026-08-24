//! Tests REQ-04-04/05/06 de export del adapter con perfil activo:
//! copia independiente a la ruta elegida y error nombrado sin destino.

use std::fs;

use super::test_support::{cleanup, store_con_perfil, temp_dir};
use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotExportError;
use crate::domain::snapshot::FinanceSnapshot;
use crate::seed;

#[test]
fn export_writes_independent_copy_to_chosen_path() {
    let base = temp_dir("export");
    let destination = base.join("salidas").join("copia.json");
    let mut repo = store_con_perfil(&base, "p_exp");
    let snapshot = seed::example_snapshot();
    repo.save(&snapshot).expect("estado vigente");
    repo.set_transfer_path(destination.clone());

    repo.export(&snapshot).expect("exportación feliz");

    let raw = fs::read_to_string(&destination).expect("copia escrita");
    let copy: FinanceSnapshot =
        serde_json::from_str(&raw).expect("copia válida");
    assert_eq!(copy, snapshot, "la copia es idéntica al vigente");
    assert_eq!(repo.load().unwrap(), snapshot, "vigente intacto");
    cleanup(&base);
}

#[test]
fn export_without_destination_is_a_named_error() {
    let base = temp_dir("export_no_dest");
    let mut repo = store_con_perfil(&base, "p_e2");
    let error = repo
        .export(&seed::example_snapshot())
        .expect_err("sin ruta de transferencia debe fallar");
    assert!(matches!(error, SnapshotExportError { .. }));
    cleanup(&base);
}
