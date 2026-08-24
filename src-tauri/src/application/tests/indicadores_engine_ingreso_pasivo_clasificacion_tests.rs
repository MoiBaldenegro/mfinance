//! Tests del motor de indicadores: ingreso pasivo - clasificación (REQ-10-05).

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
fn ingreso_pasivo_verde_cubre_100_por_ciento() {
    // Gastos 3000, ingreso pasivo (inversiones) que cubre ≥ 100% → VERDE
    // ingreso_pasivo_mensual = valor * tasa / 1200
    // Para ≥100%: valor * tasa / 1200 ≥ 3000
    // Con tasa 5%: valor ≥ 3000 * 1200 / 5 = 720,000
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
    // 720000 * 0.05 / 12 = 3000 mensual
    // 3000 / 3000 * 100 = 100% → VERDE
    assert!((ind.ingreso_pasivo.valor - 100.0).abs() < 0.1);
    assert_eq!(ind.ingreso_pasivo.clasificacion, Semaphore::Verde);
}

#[test]
fn ingreso_pasivo_amarillo_25_a_menos_100_por_ciento() {
    // Gastos 3000, ingreso pasivo ~1000 → 33% → AMARILLO (25-<100)
    // valor * 5 / 1200 = 1000 → valor = 240,000
    let mut snap = snapshot_base();
    snap.investments = vec![
        crate::domain::investment::Investment::new(
            InvestmentFamily::RentaFija,
            0.0,
            240000.0,
            5.0,
        ).unwrap(),
    ];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.ingreso_pasivo.sin_datos);
    // 240000 * 0.05 / 12 = 1000 mensual
    // 1000 / 3000 * 100 = 33.33% → AMARILLO
    assert!((ind.ingreso_pasivo.valor - 33.33).abs() < 0.1);
    assert_eq!(ind.ingreso_pasivo.clasificacion, Semaphore::Amarillo);
}

#[test]
fn ingreso_pasivo_rojo_menos_25_por_ciento() {
    // Gastos 3000, ingreso pasivo 500 → 16.7% < 25% → ROJO
    // valor * 5 / 1200 = 500 → valor = 120,000
    let mut snap = snapshot_base();
    snap.investments = vec![
        crate::domain::investment::Investment::new(
            InvestmentFamily::RentaFija,
            0.0,
            120000.0,
            5.0,
        ).unwrap(),
    ];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.ingreso_pasivo.sin_datos);
    // 120000 * 0.05 / 12 = 500 mensual
    // 500 / 3000 * 100 = 16.67% → ROJO
    assert!((ind.ingreso_pasivo.valor - 16.67).abs() < 0.1);
    assert_eq!(ind.ingreso_pasivo.clasificacion, Semaphore::Rojo);
}