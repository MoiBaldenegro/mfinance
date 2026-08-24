//! Tests REQ-13-01: saldo teórico = inicial + suma algebraica.

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
fn saldo_teorico_es_inicial_mas_suma_algebraica() {
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0), mov("2026-07-05", "Gasto", -200.0)], 1300.0),
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert_eq!(resultado.cuentas.len(), 1);
    let c = &resultado.cuentas[0];
    // teórico = 1000 + 500 - 200 = 1300
    assert!((c.saldo_teorico - 1300.0).abs() < 0.01);
}

#[test]
fn saldo_teorico_solo_inicial_con_movimiento_mes() {
    // Una cuenta con un movimiento en el mes, importe 0 para probar solo el inicial
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ajuste inicial", 0.0)], 1000.0),
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert_eq!(resultado.cuentas.len(), 1);
    let c = &resultado.cuentas[0];
    assert!((c.saldo_teorico - 1000.0).abs() < 0.01);
}

#[test]
fn saldo_teorico_multiples_movimientos_positivos_y_negativos() {
    let repo = repo_con(vec![
        estado("Cuenta A", 500.0, vec![
            mov("2026-07-01", "Ingreso 1", 100.0),
            mov("2026-07-02", "Gasto 1", -50.0),
            mov("2026-07-03", "Ingreso 2", 200.0),
            mov("2026-07-04", "Gasto 2", -75.0),
        ], 675.0),
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    let c = &resultado.cuentas[0];
    // teórico = 500 + 100 - 50 + 200 - 75 = 675
    assert!((c.saldo_teorico - 675.0).abs() < 0.01);
}