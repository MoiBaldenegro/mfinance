//! Test REQ-04-06: un JSON con esquema correcto pero invariantes rotas
//! (activo negativo, mes fuera de rango) se rechaza con error nombrado
//! sin alterar los datos vigentes.

use serde_json::Value;

use super::memory_repository::MemoryRepository;
use crate::application::import_json;
use crate::domain::repository_errors::SnapshotImportError;
use crate::domain::snapshot::FinanceSnapshot;
use crate::seed;

/// Snapshot que serde acepta pero que rompe invariantes del dominio
/// (serde deriva sin pasar por constructores validados).
fn snapshot_breaking_invariants(raw: &Value) -> FinanceSnapshot {
    serde_json::from_value(raw.clone())
        .expect("serde debe aceptar el JSON crudo")
}

/// JSON con esquema correcto pero valores controlados por parámetro.
fn json_with(valor_activo: f64, mes: &str) -> Value {
    serde_json::json!({
        "monthly_records": [{ "mes": mes, "ingresos": {}, "gastos": {} }],
        "assets": [{ "nombre": "Fondo", "categoria": "Liquido", "valor_actual": valor_activo }],
        "liabilities": [],
        "investments": [],
        "account_statements": [],
        "strategy": { "debt_strategy": "Avalanche", "extra_monthly_payment": 0.0 }
    })
}

#[test]
fn import_json_rejects_negative_asset_and_keeps_current_state() {
    let mut repo = MemoryRepository::default();
    let current = seed::example_snapshot();
    repo.stored = Some(current.clone());
    repo.exported =
        Some(snapshot_breaking_invariants(&json_with(-50.0, "2026-08")));

    let error = import_json::import_json(&mut repo)
        .expect_err("activo negativo debe rechazarse");
    assert!(matches!(error, SnapshotImportError { .. }));
    assert_eq!(
        repo.stored,
        Some(current),
        "los datos vigentes quedan intactos"
    );
}

#[test]
fn import_json_rejects_invalid_month_key_and_keeps_current_state() {
    let mut repo = MemoryRepository::default();
    let current = seed::example_snapshot();
    repo.stored = Some(current.clone());
    repo.exported =
        Some(snapshot_breaking_invariants(&json_with(100.0, "2026-13")));

    let error = import_json::import_json(&mut repo)
        .expect_err("mes fuera de rango debe rechazarse");
    assert!(matches!(error, SnapshotImportError { .. }));
    assert_eq!(repo.stored, Some(current));
}
