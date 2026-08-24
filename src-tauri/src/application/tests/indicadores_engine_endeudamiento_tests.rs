//! Tests del motor de indicadores: endeudamiento (REQ-10-02).

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
fn endeudamiento_verde_menor_15_por_ciento() {
    // Ingresos 10000, cuotas_deuda 1000 = 10% < 15% → VERDE
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[("cuotas_deuda", 1000.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.endeudamiento.sin_datos);
    assert_eq!(ind.endeudamiento.valor, 10.0);
    assert_eq!(ind.endeudamiento.clasificacion, Semaphore::Verde);
}

#[test]
fn endeudamiento_amarillo_15_a_30_por_ciento() {
    // Ingresos 10000, cuotas_deuda 2000 = 20% → AMARILLO (15-30%)
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[("cuotas_deuda", 2000.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.endeudamiento.sin_datos);
    assert_eq!(ind.endeudamiento.valor, 20.0);
    assert_eq!(ind.endeudamiento.clasificacion, Semaphore::Amarillo);
}

#[test]
fn endeudamiento_rojo_mayor_30_por_ciento() {
    // Ingresos 10000, cuotas_deuda 3500 = 35% > 30% → ROJO
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[("cuotas_deuda", 3500.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.endeudamiento.sin_datos);
    assert_eq!(ind.endeudamiento.valor, 35.0);
    assert_eq!(ind.endeudamiento.clasificacion, Semaphore::Rojo);
}

#[test]
fn endeudamiento_frontera_exacta_15_es_amarillo() {
    // Ingresos 10000, cuotas_deuda 1500 = 15% → AMARILLO (límite inferior inclusive)
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[("cuotas_deuda", 1500.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.endeudamiento.sin_datos);
    assert_eq!(ind.endeudamiento.valor, 15.0);
    assert_eq!(ind.endeudamiento.clasificacion, Semaphore::Amarillo);
}

#[test]
fn endeudamiento_frontera_exacta_30_es_amarillo() {
    // Ingresos 10000, cuotas_deuda 3000 = 30% → AMARILLO (límite superior inclusive)
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[("salario", 10000.0)], &[("cuotas_deuda", 3000.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(!ind.endeudamiento.sin_datos);
    assert_eq!(ind.endeudamiento.valor, 30.0);
    assert_eq!(ind.endeudamiento.clasificacion, Semaphore::Amarillo);
}

#[test]
fn endeudamiento_sin_ingresos_es_sin_datos() {
    // Ingresos 0 → sin datos
    let mut snap = snapshot_base();
    snap.monthly_records = vec![registro("2026-08", &[], &[("cuotas_deuda", 1000.0)])];
    let ind = calcular_indicadores(&snap);
    assert!(ind.endeudamiento.sin_datos);
}