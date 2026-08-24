//! Tests REQ-04/REQ-21 del adapter JSON con perfil activo: round-trip
//! fiel bajo perfiles/<id>/mfinance.json y escritura atómica, sobre
//! directorios temporales (NUNCA Documents real).

use std::fs;
use std::path::PathBuf;

use serde_json::Value;

use super::test_support::{cleanup, store_con_perfil, temp_dir};
use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotLoadError;
use crate::seed;

#[test]
fn round_trip_preserves_every_field_under_profile_dir() {
    let base = temp_dir("round_trip");
    let mut repo = store_con_perfil(&base, "p_rt");
    let snapshot = seed::example_snapshot();
    repo.save(&snapshot).expect("guardado inicial");
    let loaded = repo.load().expect("carga tras guardar");
    assert_eq!(loaded, snapshot, "round-trip debe ser fiel campo a campo");

    // REQ-21-02: el estado vive en la ruta propia del perfil.
    let esperada = base.join("perfiles").join("p_rt").join("mfinance.json");
    assert_eq!(
        repo.state_path().as_deref(),
        Some(esperada.as_path()),
        "el snapshot se guarda bajo perfiles/<id>/"
    );
    let raw = fs::read_to_string(esperada).unwrap();
    for key in [
        "monthly_records", "assets", "liabilities", "investments",
        "account_statements", "strategy", "debt_strategy",
        "extra_monthly_payment",
    ] {
        assert!(raw.contains(&format!("\"{key}\"")), "falta {key}");
    }
    cleanup(&base);
}

#[test]
fn save_is_atomic_and_always_leaves_valid_json() {
    let base = temp_dir("atomic");
    let mut repo = store_con_perfil(&base, "p_at");
    repo.save(&seed::example_snapshot()).expect("primer guardado");
    let mut second = seed::example_snapshot();
    second.strategy.extra_monthly_payment = 250.0;
    repo.save(&second)
        .expect("segundo guardado sobre el mismo archivo");

    let carpeta = base.join("perfiles").join("p_at");
    let raw = fs::read_to_string(carpeta.join("mfinance.json")).unwrap();
    let parsed: Value =
        serde_json::from_str(&raw).expect("JSON siempre válido");
    assert_eq!(parsed["strategy"]["extra_monthly_payment"], 250.0);
    assert_eq!(repo.load().unwrap(), second);

    let leftovers: Vec<PathBuf> = fs::read_dir(&carpeta)
        .unwrap()
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.extension().is_some_and(|e| e == "tmp"))
        .collect();
    assert!(leftovers.is_empty(), "quedan temporales: {leftovers:?}");
    cleanup(&base);
}

#[test]
fn load_returns_named_error_when_active_profile_has_no_snapshot() {
    let base = temp_dir("missing_state");
    let repo = store_con_perfil(&base, "p_vacio");
    let error = repo.load().expect_err("sin archivo debe fallar");
    assert!(matches!(error, SnapshotLoadError { .. }));
    assert!(error.to_string().contains("no se pudo cargar"));
    cleanup(&base);
}
