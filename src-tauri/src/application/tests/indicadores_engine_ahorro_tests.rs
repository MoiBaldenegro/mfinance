//! Tests del motor de indicadores: tasa de ahorro (REQ-10-03).

use crate::application::indicadores_engine::calcular_indicadores;
use crate::application::indicadores_types::Semaphore;
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
            &[("vivienda", 5000.0), ("alimentacion", 3000.0), ("cuotas_deuda", 1000.0)],
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
fn tasa_ahorro_verde_mayor_15_por_ciento() {
    // Ingresos 10000, gastos 8000 → ahorro 2000 = 20% > 15% → VERDE
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[("vivienda", 5000.0), ("alimentacion", 3000.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.tasa_ahorro.sin_datos);
    assert_eq!(ind.tasa_ahorro.valor, 20.0);
    assert_eq!(ind.tasa_ahorro.clasificacion, Semaphore::Verde);
}

#[test]
fn tasa_ahorro_amarillo_5_a_15_por_ciento() {
    // Ingresos 10000, gastos 9000 → ahorro 1000 = 10% → AMARILLO (5-15%)
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[("vivienda", 5000.0), ("alimentacion", 4000.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.tasa_ahorro.sin_datos);
    assert_eq!(ind.tasa_ahorro.valor, 10.0);
    assert_eq!(ind.tasa_ahorro.clasificacion, Semaphore::Amarillo);
}

#[test]
fn tasa_ahorro_rojo_menor_5_por_ciento() {
    // Ingresos 10000, gastos 9600 → ahorro 400 = 4% < 5% → ROJO
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[("vivienda", 5000.0), ("alimentacion", 4600.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.tasa_ahorro.sin_datos);
    assert_eq!(ind.tasa_ahorro.valor, 4.0);
    assert_eq!(ind.tasa_ahorro.clasificacion, Semaphore::Rojo);
}

#[test]
fn tasa_ahorro_frontera_exacta_15_es_amarillo() {
    // Ingresos 10000, gastos 8500 → ahorro 1500 = 15% → AMARILLO (límite inferior inclusive)
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[("vivienda", 5000.0), ("alimentacion", 3500.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.tasa_ahorro.sin_datos);
    assert_eq!(ind.tasa_ahorro.valor, 15.0);
    assert_eq!(ind.tasa_ahorro.clasificacion, Semaphore::Amarillo);
}

#[test]
fn tasa_ahorro_frontera_exacta_5_es_amarillo() {
    // Ingresos 10000, gastos 9500 → ahorro 500 = 5% → AMARILLO (límite inferior inclusive)
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[("vivienda", 5000.0), ("alimentacion", 4500.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.tasa_ahorro.sin_datos);
    assert_eq!(ind.tasa_ahorro.valor, 5.0);
    assert_eq!(ind.tasa_ahorro.clasificacion, Semaphore::Amarillo);
}

#[test]
fn tasa_ahorro_sin_ingresos_es_sin_datos() {
    // Ingresos 0 → sin datos
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[], &[("vivienda", 1000.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(ind.tasa_ahorro.sin_datos);
}