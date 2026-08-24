//! REQ-03-02/09: Liability con nombre, saldo pendiente y tasa de interés
//! anual; valores negativos rechazados con error nombrado.

use crate::domain::errors::NegativeValueError;
use crate::domain::liability::Liability;

#[test]
fn builds_liability_with_balance_and_rate() {
    let liability = Liability::new(
        "Hipoteca".to_string(),
        85000.0,
        3.15,
    )
    .expect("liability válida");
    assert_eq!(liability.nombre(), "Hipoteca");
    assert!((liability.saldo_pendiente() - 85000.0).abs() < 1e-9);
    assert!((liability.tasa_interes_anual() - 3.15).abs() < 1e-9);
}

#[test]
fn negative_pending_balance_is_rejected_with_named_error() {
    let err =
        Liability::new("Tarjeta".to_string(), -10.0, 18.0).unwrap_err();
    assert_eq!(err.entidad, "Liability");
    assert_eq!(err.campo, "saldo_pendiente");
    assert!((err.valor + 10.0).abs() < 1e-9);
}

#[test]
fn negative_annual_rate_is_rejected_with_named_error() {
    let err =
        Liability::new("Préstamo".to_string(), 5000.0, -0.5).unwrap_err();
    assert_eq!(
        err,
        NegativeValueError {
            entidad: "Liability",
            campo: "tasa_interes_anual",
            valor: -0.5,
        }
    );
}
