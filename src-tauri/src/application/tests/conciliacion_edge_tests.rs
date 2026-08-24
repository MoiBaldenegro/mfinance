//! Tests REQ-13: casos borde y errores.

use super::memory_repository::MemoryRepository;
use crate::application::conciliacion::conciliacion_mensual;
use crate::application::conciliacion_types::ConciliacionError;
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
fn sin_datos_devuelve_error() {
    let repo = MemoryRepository::default(); // sin stored
    let err = conciliacion_mensual(&repo, "2026-07").unwrap_err();
    matches!(err, ConciliacionError::SinDatos);
}

#[test]
fn mes_sin_cuentas_devuelve_lista_vacia_con_todas_conciliadas_true() {
    let repo = repo_con(vec![]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert!(resultado.cuentas.is_empty());
    assert!(resultado.todas_conciliadas);
}

#[test]
fn mes_inexistente_devuelve_conciliacion_vacia() {
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-08").expect("conciliación OK");
    assert!(resultado.cuentas.is_empty());
    assert!(resultado.todas_conciliadas);
    assert_eq!(resultado.mes, "2026-08");
}

#[test]
fn diferencia_cero_es_conciliada() {
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert!(resultado.cuentas[0].conciliada);
    assert!((resultado.cuentas[0].diferencia).abs() < 0.005);
}

#[test]
fn todas_conciliadas_true_cuando_todas_las_cuentas_conciliadas() {
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
        estado("Cuenta B", 2000.0, vec![mov("2026-07-02", "Gasto", -300.0)], 1700.0),
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert!(resultado.todas_conciliadas);
}

#[test]
fn todas_conciliadas_false_cuando_alguna_cuenta_descuadrada() {
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
        estado("Cuenta B", 2000.0, vec![mov("2026-07-02", "Gasto", -300.0)], 1600.0), // descuadrada
    ]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert!(!resultado.todas_conciliadas);
}