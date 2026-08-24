//! Tests REQ-13-07: histórico mensual sin mezclar saldos.

use super::memory_repository::MemoryRepository;
use crate::application::conciliacion::HistoricoConciliacion;
use crate::application::conciliacion::conciliacion_mensual;
use crate::domain::account_statement::{AccountStatement, Movement};
use crate::domain::repository::SnapshotRepository;
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
fn historico_mensual_sin_mezclar_saldos() {
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
        estado("Cuenta A", 2000.0, vec![mov("2026-08-01", "Ingreso", 300.0)], 2300.0),
    ]);
    let historico = HistoricoConciliacion::from_snapshot(&repo.load().expect("carga OK"));
    // Debe haber 2 meses distintos
    assert_eq!(historico.meses.len(), 2);
    assert!(historico.meses.contains(&"2026-07".to_string()));
    assert!(historico.meses.contains(&"2026-08".to_string()));
    // Cada mes tiene sus propios saldos
    let jul = historico.por_mes("2026-07").expect("julio existe");
    let ago = historico.por_mes("2026-08").expect("agosto existe");
    assert_eq!(jul.cuentas.len(), 1);
    assert_eq!(ago.cuentas.len(), 1);
    assert!((jul.cuentas[0].saldo_inicial - 1000.0).abs() < 0.01);
    assert!((ago.cuentas[0].saldo_inicial - 2000.0).abs() < 0.01);
}

#[test]
fn historico_meses_ordenados_cronologicamente() {
    let repo = repo_con(vec![
        estado("Cuenta A", 2000.0, vec![mov("2026-08-01", "Ingreso", 300.0)], 2300.0),
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
    ]);
    let historico = HistoricoConciliacion::from_snapshot(&repo.load().expect("carga OK"));
    // Los meses deben estar ordenados
    assert_eq!(historico.meses[0], "2026-07");
    assert_eq!(historico.meses[1], "2026-08");
}

#[test]
fn historico_mes_con_multiples_cuentas() {
    let repo = repo_con(vec![
        estado("Cuenta A", 1000.0, vec![mov("2026-07-01", "Ingreso", 500.0)], 1500.0),
        estado("Cuenta B", 2000.0, vec![mov("2026-07-02", "Gasto", -300.0)], 1700.0),
    ]);
    let historico = HistoricoConciliacion::from_snapshot(&repo.load().expect("carga OK"));
    let jul = historico.por_mes("2026-07").expect("julio existe");
    assert_eq!(jul.cuentas.len(), 2);
}

#[test]
fn historico_mes_sin_cuentas_devuelve_lista_vacia() {
    let repo = repo_con(vec![]);
    let historico = HistoricoConciliacion::from_snapshot(&repo.load().expect("carga OK"));
    let jul = historico.por_mes("2026-07");
    assert!(jul.is_none());
}

#[test]
fn conciliacion_mensual_mes_sin_cuentas_devuelve_lista_vacia() {
    let repo = repo_con(vec![]);
    let resultado = conciliacion_mensual(&repo, "2026-07").expect("conciliación OK");
    assert!(resultado.cuentas.is_empty());
    assert!(resultado.todas_conciliadas);
}