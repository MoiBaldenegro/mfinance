//! Tests REQ-13-02..04: estado conciliado/descuadrada y diferencia exacta.

use super::memory_repository::MemoryRepository;
use crate::application::conciliacion::conciliacion_mensual;
use crate::domain::account_statement::{AccountStatement, Movement};
use crate::domain::snapshot::FinanceSnapshot;

fn repo_con(estados: Vec<AccountStatement>) -> MemoryRepository {
    let mut repo = MemoryRepository::default();
    let mut snapshot = FinanceSnapshot::new();
    snapshot.account_statements = estados;
    repo.stored = Some(snapshot);
    repo
}

fn estado(cuenta: &str, inicial: f64, movimientos: Vec<Movement>, final_real: f64) -> AccountStatement {
    AccountStatement::new(cuenta.into(), inicial, movimientos, final_real)
}

fn mov(fecha: &str, concepto: &str, importe: f64) -> Movement {
    Movement { fecha: fecha.into(), concepto: concepto.into(), importe }
}

#[test]
fn cuenta_conciliada_cuando_real_igual_teorico() {
    // teórico = 1000 + 500 - 200 = 1300, real = 1300 → conciliada
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0), mov("2026-07-05", "Gasto", -200.0)], 1300.0),
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert!(resultado.cuentas[0].conciliada);
    assert!((resultado.cuentas[0].diferencia).abs() < 0.005);
}

#[test]
fn cuenta_descuadrada_con_diferencia_exacta_positiva() {
    // teórico = 1000 + 500 - 200 = 1300, real = 1350 → descuadrada, diferencia = +50
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0), mov("2026-07-05", "Gasto", -200.0)], 1350.0),
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert!(!resultado.cuentas[0].conciliada);
    assert!((resultado.cuentas[0].diferencia - 50.0).abs() < 0.01);
}

#[test]
fn cuenta_descuadrada_con_diferencia_exacta_negativa() {
    // teórico = 1000 + 500 - 200 = 1300, real = 1250 → descuadrada, diferencia = -50
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0), mov("2026-07-05", "Gasto", -200.0)], 1250.0),
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert!(!resultado.cuentas[0].conciliada);
    assert!((resultado.cuentas[0].diferencia - (-50.0)).abs() < 0.01);
}

#[test]
fn multiples_cuentas_con_estados_distintos() {
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0), // conciliada
        estado("Cuenta B", 2000.0, vec![mov("2026-07-02", "Gasto", -300.0)], 1600.0), // descuadrada (teórico 1700)
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert_eq!(resultado.cuentas.len(), 2);
    assert!(resultado.cuentas.iter().any(|c| c.cuenta == "Cuenta A" && c.conciliada));
    assert!(resultado.cuentas.iter().any(|c| c.cuenta == "Cuenta B" && !c.conciliada));
}

#[test]
fn tolerancia_medio_centimo_conciliada() {
    // diferencia = 0.004 → conciliada (|0.004| < 0.005)
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.004)], 1500.0),
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert!(resultado.cuentas[0].conciliada);
}

#[test]
fn tolerancia_medio_centimo_descuadrada() {
    // diferencia = 0.005 → descuadrada (|0.005| >= 0.005)
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.005)], 1500.0),
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert!(!resultado.cuentas[0].conciliada);
}