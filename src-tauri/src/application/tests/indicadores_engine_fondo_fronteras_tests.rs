//! Tests del motor de indicadores: fondo de emergencia - fronteras y sin datos (REQ-10-04).

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
fn fondo_emergencia_frontera_exacta_3_es_verde() {
    // Gastos mensuales 3000, activos líquidos 9000 → 3 meses exactos → VERDE (≥3)
    let mut snap = snapshot_base();
    snap.assets = vec![
        crate::domain::asset::Asset::new("Cuenta".into(), AssetCategory::Liquido, 9000.0).unwrap(),
    ];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.fondo_emergencia.sin_datos);
    assert_eq!(ind.fondo_emergencia.valor, 3.0);
    assert_eq!(ind.fondo_emergencia.clasificacion, Semaphore::Verde);
}

#[test]
fn fondo_emergencia_frontera_exacta_1_es_amarillo() {
    // Gastos mensuales 3000, activos líquidos 3000 → 1 mes exacto → AMARILLO (≥1)
    let mut snap = snapshot_base();
    snap.assets = vec![
        crate::domain::asset::Asset::new("Cuenta".into(), AssetCategory::Liquido, 3000.0).unwrap(),
    ];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.fondo_emergencia.sin_datos);
    assert_eq!(ind.fondo_emergencia.valor, 1.0);
    assert_eq!(ind.fondo_emergencia.clasificacion, Semaphore::Amarillo);
}

#[test]
fn fondo_emergencia_sin_gastos_es_sin_datos() {
    // Sin gastos → sin datos
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[])];
    snap.assets = vec![
        crate::domain::asset::Asset::new("Cuenta".into(), AssetCategory::Liquido, 10000.0).unwrap(),
    ];
    let ind = calcular_indicadores(&snap);
    assert!(ind.fondo_emergencia.sin_datos);
}