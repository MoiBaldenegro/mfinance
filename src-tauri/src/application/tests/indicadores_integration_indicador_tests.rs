//! Tests de integración: fachada `indicadores` - indicadores específicos.

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
fn integracion_fondo_emergencia_verde() {
    let snapshot = FinanceSnapshot {
        monthly_records: vec![registro("2026-08", &[("salario", 10000.0)], &[("vivienda", 2000.0), ("alimentacion", 1000.0)])],
        assets: vec![
            crate::domain::asset::Asset::new("Cuenta".into(), crate::domain::asset::AssetCategory::Liquido, 10000.0).unwrap(),
        ],
        liabilities: vec![],
        investments: vec![],
        account_statements: vec![],
        strategy: Default::default(),
        assessments: vec![],
    };
    let repo = repo_con_snapshot(snapshot);
    let res = indicadores(&repo).expect("indicadores");
    assert!(!res.fondo_emergencia.sin_datos);
    assert!((res.fondo_emergencia.valor - 3.33).abs() < 0.02);
    assert_eq!(res.fondo_emergencia.clasificacion, Semaphore::Verde);
}

#[test]
fn integracion_ingreso_pasivo_rojo() {
    let snapshot = FinanceSnapshot {
        monthly_records: vec![registro("2026-08", &[("salario", 10000.0)], &[("vivienda", 2000.0), ("alimentacion", 1000.0)])],
        assets: vec![],
        liabilities: vec![],
        investments: vec![
            crate::domain::investment::Investment::new(
                crate::domain::investment::InvestmentFamily::RentaFija,
                0.0,
                120000.0,
                5.0,
            ).unwrap(),
        ],
        account_statements: vec![],
        strategy: Default::default(),
        assessments: vec![],
    };
    let repo = repo_con_snapshot(snapshot);
    let res = indicadores(&repo).expect("indicadores");
    assert!(!res.ingreso_pasivo.sin_datos);
    assert!((res.ingreso_pasivo.valor - 16.67).abs() < 0.1);
    assert_eq!(res.ingreso_pasivo.clasificacion, Semaphore::Rojo);
}