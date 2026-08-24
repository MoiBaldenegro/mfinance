//! Tests REQ-04-05/06 de import del adapter con perfil activo:
//! restauración fiel y errores nombrados sin alterar los datos
//! vigentes del perfil.

use std::fs;

use super::test_support::{cleanup, store_con_perfil, temp_dir};
use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotImportError;
use crate::seed;

#[test]
fn import_happy_restores_the_exported_snapshot() {
    let base = temp_dir("import_ok");
    let origin = base.join("backup.json");
    let mut repo = store_con_perfil(&base, "p_imp");
    repo.save(&seed::example_snapshot()).unwrap();

    let mut other = seed::example_snapshot();
    other.strategy.extra_monthly_payment = 75.5;
    fs::write(&origin, serde_json::to_string_pretty(&other).unwrap())
        .unwrap();
    repo.set_transfer_path(origin);

    let imported = repo.import().expect("importación válida");
    assert_eq!(imported, other);
    cleanup(&base);
}

#[test]
fn import_invalid_json_is_named_error_and_keeps_current_data() {
    let base = temp_dir("import_broken");
    let origin = base.join("roto.json");
    let mut repo = store_con_perfil(&base, "p_i2");
    let current = seed::example_snapshot();
    repo.save(&current).unwrap();

    fs::write(&origin, "{ esto no es json").unwrap();
    repo.set_transfer_path(origin);

    let error = repo.import().expect_err("JSON inválido debe fallar");
    assert!(matches!(error, SnapshotImportError { .. }));
    assert_eq!(
        repo.load().unwrap(),
        current,
        "los datos vigentes no se alteran"
    );
    cleanup(&base);
}

#[test]
fn import_wrong_schema_is_named_error_and_keeps_current_data() {
    let base = temp_dir("import_schema");
    let origin = base.join("otro_esquema.json");
    let mut repo = store_con_perfil(&base, "p_i3");
    let current = seed::example_snapshot();
    repo.save(&current).unwrap();

    fs::write(&origin, r#"{ "hola": 1 }"#).unwrap();
    repo.set_transfer_path(origin);

    let error = repo.import().expect_err("esquema ajeno debe fallar");
    assert!(matches!(error, SnapshotImportError { .. }));
    assert_eq!(repo.load().unwrap(), current);
    cleanup(&base);
}
