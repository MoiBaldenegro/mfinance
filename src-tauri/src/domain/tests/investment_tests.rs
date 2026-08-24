//! REQ-03-03: Investment con familia (renta_fija renta_variable finca_raiz),
//! aporte mensual, valor actual y tasa esperada editable.

use crate::domain::errors::{NegativeValueError, UnknownFamilyError};
use crate::domain::investment::{Investment, InvestmentFamily};

#[test]
fn investment_families_match_catalog_exactly() {
    let expected = [
        (InvestmentFamily::RentaFija, "renta_fija"),
        (InvestmentFamily::RentaVariable, "renta_variable"),
        (InvestmentFamily::FincaRaiz, "finca_raiz"),
    ];
    assert_eq!(InvestmentFamily::ALL.len(), 3);
    for (i, (variant, key)) in expected.iter().enumerate() {
        assert_eq!(&InvestmentFamily::ALL[i], variant);
        assert_eq!(variant.as_str(), *key);
        assert_eq!(InvestmentFamily::parse(key), Ok(*variant));
    }
}

#[test]
fn unknown_family_is_rejected_with_named_error() {
    let err = InvestmentFamily::parse("cripto").unwrap_err();
    assert_eq!(
        err,
        UnknownFamilyError { valor: "cripto".to_string() }
    );
}

#[test]
fn builds_investment_with_editable_expected_rate() {
    let inv = Investment::new(
        InvestmentFamily::RentaVariable,
        200.0,
        9500.0,
        7.0,
    )
    .expect("inversión válida");
    assert_eq!(inv.familia(), InvestmentFamily::RentaVariable);
    assert!((inv.aporte_mensual() - 200.0).abs() < 1e-9);
    assert!((inv.valor_actual() - 9500.0).abs() < 1e-9);
    assert!((inv.tasa_esperada_anual() - 7.0).abs() < 1e-9);
}

#[test]
fn negative_monthly_contribution_is_rejected_by_name() {
    let err = Investment::new(
        InvestmentFamily::RentaFija,
        -1.0,
        1000.0,
        3.0,
    )
    .unwrap_err();
    assert_eq!(err.campo, "aporte_mensual");
    assert_eq!(err.entidad, "Investment");
}

#[test]
fn negative_current_value_is_rejected_by_name() {
    let err = Investment::new(
        InvestmentFamily::FincaRaiz,
        0.0,
        -50000.0,
        5.0,
    )
    .unwrap_err();
    assert_eq!(
        err,
        NegativeValueError {
            entidad: "Investment",
            campo: "valor_actual",
            valor: -50000.0,
        }
    );
}

#[test]
fn negative_expected_rate_is_rejected_by_name() {
    let err = Investment::new(
        InvestmentFamily::RentaVariable,
        100.0,
        1200.0,
        -5.0,
    )
    .unwrap_err();
    assert_eq!(
        err,
        NegativeValueError {
            entidad: "Investment",
            campo: "tasa_esperada_anual",
            valor: -5.0,
        }
    );
}
