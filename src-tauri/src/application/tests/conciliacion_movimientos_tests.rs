//! Tests REQ-13-05: agregar movimiento recalcula teórico y persiste.

use super::memory_repository::MemoryRepository;
use crate::application::conciliacion::agregar_movimiento;
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
fn agregar_movimiento_recalcula_teorico_y_persiste() {
    let mut repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
    ]);
    // Agregar movimiento -200
    let snapshot = agregar_movimiento(&mut repo, "2026-07", "Cuenta A", mov("2026-07-10", "Nuevo gasto", -200.0))
        .expect("movimiento agregado");
    // Verificar que el snapshot actualizado tiene el movimiento
    let cuenta = snapshot.account_statements.iter().find(|c| c.cuenta() == "Cuenta A").expect("cuenta existe");
    assert_eq!(cuenta.movimientos().len(), 2);
    // Teórico debería ser 1000 + 500 - 200 = 1300
    assert!((cuenta.theoretical_balance() - 1300.0).abs() < 0.01);
}

#[test]
fn agregar_movimiento_concepto_vacio_error() {
    let mut repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
    ]);
    let err = agregar_movimiento(&mut repo, "2026-07", "Cuenta A", mov("2026-07-10", "", -200.0))
        .unwrap_err();
    matches!(err, crate::application::conciliacion_types::ConciliacionError::MovimientoInvalido(_));
}

#[test]
fn agregar_movimiento_importe_no_finito_error() {
    let mut repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
    ]);
    let err = agregar_movimiento(&mut repo, "2026-07", "Cuenta A", mov("2026-07-10", "Test", f64::NAN))
        .unwrap_err();
    matches!(err, crate::application::conciliacion_types::ConciliacionError::MovimientoInvalido(_));
}

#[test]
fn agregar_movimiento_cuenta_no_encontrada_error() {
    let mut repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
    ]);
    let err = agregar_movimiento(&mut repo, "2026-07", "Cuenta B", mov("2026-07-10", "Test", -200.0))
        .unwrap_err();
    matches!(err, crate::application::conciliacion_types::ConciliacionError::CuentaNoEncontrada(_));
}

#[test]
fn agregar_movimiento_multiples_movimientos_acumulativos() {
    let mut repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
    ]);
    // Primer movimiento
    agregar_movimiento(&mut repo, "2026-07", "Cuenta A", mov("2026-07-10", "Gasto 1", -200.0))
        .expect("movimiento 1");
    // Segundo movimiento
    let snapshot = agregar_movimiento(&mut repo, "2026-07", "Cuenta A", mov("2026-07-15", "Gasto 2", -100.0))
        .expect("movimiento 2");
    let cuenta = snapshot.account_statements.iter().find(|c| c.cuenta() == "Cuenta A").expect("cuenta existe");
    assert_eq!(cuenta.movimientos().len(), 3);
    // Teórico = 1000 + 500 - 200 - 100 = 1200
    assert!((cuenta.theoretical_balance() - 1200.0).abs() < 0.01);
}