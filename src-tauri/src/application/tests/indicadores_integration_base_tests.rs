//! Tests de integración: fachada `indicadores` - casos base y sin datos.

use crate::application::indicadores_fachada::indicadores;
use crate::application::indicadores_types::Semaphore;
use crate::application::tests::memory_repository::MemoryRepository;
use crate::domain::monthly_record::MonthlyRecord;
use crate::domain::snapshot::FinanceSnapshot;

fn registro(
    mes: &str,
    ingresos: &[(&str, f64)],
    gastos: &[(&str, f64)],
) -> MonthlyRecord {
    MonthlyRecord::from_raw(mes, ingresos, gastos).expect("registro válido")
}

fn repo_con_snapshot(snapshot: FinanceSnapshot) -> MemoryRepository {
    let mut repo = MemoryRepository::default();
    repo.stored = Some(snapshot);
    repo
}

#[test]
fn sin_registros_devuelve_indicadores_sin_datos() {
    let repo = repo_con_snapshot(FinanceSnapshot::new());
    let res = indicadores(&repo).expect("indicadores sobre vacío");
    assert!(res.endeudamiento.sin_datos);
    assert!(res.tasa_ahorro.sin_datos);
    assert!(res.fondo_emergencia.sin_datos);
    assert!(res.ingreso_pasivo.sin_datos);
}

#[test]
fn integracion_endeudamiento_verde() {
    let snapshot = FinanceSnapshot {
        monthly_records: vec![registro("2026-08", &[("salario", 10000.0)], &[("cuotas_deuda", 1000.0)])],
        liabilities: vec![],
        assets: vec![],
        investments: vec![],
        account_statements: vec![],
        strategy: Default::default(),
        assessments: vec![],
    };
    let repo = repo_con_snapshot(snapshot);
    let res = indicadores(&repo).expect("indicadores");
    assert!(!res.endeudamiento.sin_datos);
    assert_eq!(res.endeudamiento.valor, 10.0);
    assert_eq!(res.endeudamiento.clasificacion, Semaphore::Verde);
}

#[test]
fn integracion_tasa_ahorro_amarillo() {
    let snapshot = FinanceSnapshot {
        monthly_records: vec![registro("2026-08", &[("salario", 10000.0)], &[("vivienda", 5000.0), ("alimentacion", 4000.0)])],
        liabilities: vec![],
        assets: vec![],
        investments: vec![],
        account_statements: vec![],
        strategy: Default::default(),
        assessments: vec![],
    };
    let repo = repo_con_snapshot(snapshot);
    let res = indicadores(&repo).expect("indicadores");
    assert!(!res.tasa_ahorro.sin_datos);
    assert_eq!(res.tasa_ahorro.valor, 10.0);
    assert_eq!(res.tasa_ahorro.clasificacion, Semaphore::Amarillo);
}