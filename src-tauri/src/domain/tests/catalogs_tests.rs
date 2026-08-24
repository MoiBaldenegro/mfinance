//! REQ-03-01/08: catálogos exactos de fuentes de ingreso y categorías de
//! gasto; un valor fuera de catálogo produce el error nombrado.

use crate::domain::catalogs::{ExpenseCategory, IncomeSource};
use crate::domain::errors::{UnknownCategoryError, UnknownSourceError};

#[test]
fn income_sources_match_catalog_exactly() {
    let expected = [
        (IncomeSource::Salario, "salario"),
        (IncomeSource::Freelance, "freelance"),
        (IncomeSource::Arriendos, "arriendos"),
        (IncomeSource::Otros, "otros"),
    ];
    assert_eq!(IncomeSource::ALL.len(), 4);
    for (i, (variant, key)) in expected.iter().enumerate() {
        assert_eq!(&IncomeSource::ALL[i], variant);
        assert_eq!(variant.as_str(), *key);
        assert_eq!(IncomeSource::parse(key), Ok(*variant));
    }
}

#[test]
fn expense_categories_match_catalog_exactly() {
    let expected = [
        (ExpenseCategory::Vivienda, "vivienda"),
        (ExpenseCategory::Alimentacion, "alimentacion"),
        (ExpenseCategory::Transporte, "transporte"),
        (ExpenseCategory::CuotasDeuda, "cuotas_deuda"),
        (ExpenseCategory::Ocio, "ocio"),
        (ExpenseCategory::Otros, "otros"),
    ];
    assert_eq!(ExpenseCategory::ALL.len(), 6);
    for (i, (variant, key)) in expected.iter().enumerate() {
        assert_eq!(&ExpenseCategory::ALL[i], variant);
        assert_eq!(variant.as_str(), *key);
        assert_eq!(ExpenseCategory::parse(key), Ok(*variant));
    }
}

#[test]
fn unknown_income_source_is_rejected_with_named_error() {
    let err = IncomeSource::parse("bono_extra").unwrap_err();
    assert_eq!(
        err,
        UnknownSourceError { valor: "bono_extra".to_string() }
    );
    assert_eq!(
        err.to_string(),
        "fuente de ingreso desconocida: \"bono_extra\""
    );
}

#[test]
fn unknown_expense_category_is_rejected_with_named_error() {
    let err = ExpenseCategory::parse("viajes").unwrap_err();
    assert_eq!(
        err,
        UnknownCategoryError { valor: "viajes".to_string() }
    );
}
