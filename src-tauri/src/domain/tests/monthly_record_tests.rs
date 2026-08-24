//! REQ-03-01/08: MonthlyRecord con clave YYYY-MM, ingresos por fuente y
//! gastos por categoría; entradas fuera de catálogo se rechazan.

use crate::domain::catalogs::{ExpenseCategory, IncomeSource};
use crate::domain::month_key::MonthKey;
use crate::domain::monthly_record::{MonthlyRecord, MonthlyRecordError};

fn record_from_raw() -> MonthlyRecord {
    MonthlyRecord::from_raw(
        "2026-01",
        &[("salario", 2000.0), ("arriendos", 350.0)],
        &[("vivienda", 700.0), ("ocio", 150.0), ("otros", 40.0)],
    )
    .expect("registro válido")
}

#[test]
fn builds_record_with_typed_catalog_keys_and_month() {
    let rec = record_from_raw();
    assert_eq!(rec.mes(), &MonthKey::parse("2026-01").unwrap());
    assert_eq!(rec.ingreso(IncomeSource::Salario), Some(&2000.0));
    assert_eq!(rec.gasto(ExpenseCategory::Ocio), Some(&150.0));
    assert_eq!(rec.ingreso(IncomeSource::Freelance), None);
}

#[test]
fn totals_are_the_sum_per_side() {
    let rec = record_from_raw();
    assert!((rec.total_income() - 2350.0).abs() < 1e-9);
    assert!((rec.total_expense() - 890.0).abs() < 1e-9);
}

#[test]
fn month_without_entries_opens_at_zero() {
    let rec =
        MonthlyRecord::new(MonthKey::parse("2026-02").unwrap(), [], []);
    assert!((rec.total_income()).abs() < 1e-9);
    assert!((rec.total_expense()).abs() < 1e-9);
}

#[test]
fn unknown_income_source_is_rejected_by_name() {
    let err = MonthlyRecord::from_raw(
        "2026-01",
        &[("bono_extra", 100.0)],
        &[],
    )
    .unwrap_err();
    assert!(matches!(
        err,
        MonthlyRecordError::UnknownSource(_)
    ));
}

#[test]
fn unknown_expense_category_is_rejected_by_name() {
    let err = MonthlyRecord::from_raw(
        "2026-01",
        &[],
        &[("viajes", 100.0)],
    )
    .unwrap_err();
    assert!(matches!(
        err,
        MonthlyRecordError::UnknownCategory(_)
    ));
}

#[test]
fn invalid_month_key_is_rejected_by_name() {
    let err = MonthlyRecord::from_raw("26-1", &[], &[]).unwrap_err();
    assert!(matches!(err, MonthlyRecordError::InvalidMonth(_)));
}

#[test]
fn negative_amounts_are_outside_record_scope() {
    // REQ-03-09 aplica a Asset/Liability/Investment; el registro mensual
    // acepta importes tal cual (los negativos se bloquean en la capa UI/F6).
    let rec = MonthlyRecord::from_raw("2026-03", &[("otros", -50.0)], &[]);
    assert!(rec.is_ok());
}
