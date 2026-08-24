//! Tests del motor de indicadores: ingreso pasivo - fronteras y sin datos (REQ-10-05).

use crate::application::indicadores_engine::calcular_indicadores;
use crate::application::indicadores_types::Semaphore;
use crate::domain::investment::InvestmentFamily;
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
fn ingreso_pasivo_frontera_exacta_100_es_verde() {
    // Gastos 3000, ingreso pasivo 3000 → 100% → VERDE (≥100)
    let mut snap = snapshot_base();
    snap.investments = vec![
        crate::domain::investment::Investment::new(
            InvestmentFamily::RentaFija,
            0.0,
            720000.0,
            5.0,
        ).unwrap(),
    ];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.ingreso_pasivo.sin_datos);
    assert_eq!(ind.ingreso_pasivo.clasificacion, Semaphore::Verde);
}

#[test]
fn ingreso_pasivo_frontera_exacta_25_es_amarillo() {
    // Gastos 3000, ingreso pasivo 750 → 25% → AMARILLO (≥25)
    // valor * 5 / 1200 = 750 → valor = 180,000
    let mut snap = snapshot_base();
    snap.investments = vec![
        crate::domain::investment::Investment::new(
            InvestmentFamily::RentaFija,
            0.0,
            180000.0,
            5.0,
        ).unwrap(),
    ];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.ingreso_pasivo.sin_datos);
    // 180000 * 0.05 / 12 = 750 mensual
    // 750 / 3000 * 100 = 25% → AMARILLO
    assert!((ind.ingreso_pasivo.valor - 25.0).abs() < 0.1);
    assert_eq!(ind.ingreso_pasivo.clasificacion, Semaphore::Amarillo);
}

#[test]
fn ingreso_pasivo_sin_gastos_es_sin_datos() {
    // Sin gastos → sin datos
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[])];
    snap.investments = vec![
        crate::domain::investment::Investment::new(
            InvestmentFamily::RentaFija,
            0.0,
            10000.0,
            5.0,
        ).unwrap(),
    ];
    let ind = calcular_indicadores(&snap);
    assert!(ind.ingreso_pasivo.sin_datos);
}