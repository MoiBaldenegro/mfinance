//! Tests del motor de indicadores: fondo de emergencia - clasificación (REQ-10-04).

use crate::application::indicadores_engine::calcular_indicadores;
use crate::application::indicadores_types::Semaphore;
use crate::domain::asset::AssetCategory;
use crate::domain::monthly_record::MonthlyRecord;
use crate::domain::snapshot::FinanceSnapshot;

fn registro(
    mes: &str,
    ingresos: &[(&str, f64)],
    gastos: &[(&str, f64)],
) -> MonthlyRecord {
    MonthlyRecord::from_raw(mes, ingresos, gastos).expect("registro válido")
}

fn snapshot_base() -> FinanceSnapshot {
    FinanceSnapshot {
        monthly_records: vec![registro(
            "2026-08",
            &[("salario", 10000.0)],
            &[("vivienda", 2000.0), ("alimentacion", 1000.0)],
        )],
        assets: vec![],
        liabilities: vec![],
        investments: vec![],
        account_statements: vec![],
        strategy: Default::default(),
        assessments: vec![],
    }
}

#[test]
fn fondo_emergencia_verde_tres_o_mas_meses() {
    // Gastos mensuales 3000, activos líquidos 10000 → 3.33 meses ≥ 3 → VERDE
    let mut snap = snapshot_base();
    snap.assets = vec![
        crate::domain::asset::Asset::new("Cuenta".into(), AssetCategory::Liquido, 10000.0).unwrap(),
    ];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.fondo_emergencia.sin_datos);
    assert!((ind.fondo_emergencia.valor - 3.33).abs() < 0.02);
    assert_eq!(ind.fondo_emergencia.clasificacion, Semaphore::Verde);
}

#[test]
fn fondo_emergencia_amarillo_uno_a_menos_de_tres_meses() {
    // Gastos mensuales 3000, activos líquidos 5000 → 1.67 meses → AMARILLO (1-<3)
    let mut snap = snapshot_base();
    snap.assets = vec![
        crate::domain::asset::Asset::new("Cuenta".into(), AssetCategory::Liquido, 5000.0).unwrap(),
    ];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.fondo_emergencia.sin_datos);
    assert!((ind.fondo_emergencia.valor - 1.67).abs() < 0.02);
    assert_eq!(ind.fondo_emergencia.clasificacion, Semaphore::Amarillo);
}

#[test]
fn fondo_emergencia_rojo_menos_de_un_mes() {
    // Gastos mensuales 3000, activos líquidos 2000 → 0.67 meses < 1 → ROJO
    let mut snap = snapshot_base();
    snap.assets = vec![
        crate::domain::asset::Asset::new("Cuenta".into(), AssetCategory::Liquido, 2000.0).unwrap(),
    ];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.fondo_emergencia.sin_datos);
    assert!((ind.fondo_emergencia.valor - 0.67).abs() < 0.02);
    assert_eq!(ind.fondo_emergencia.clasificacion, Semaphore::Rojo);
}