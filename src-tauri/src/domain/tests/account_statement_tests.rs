//! REQ-03-04: AccountStatement con saldo inicial, movimientos y saldo final
//! para conciliación (saldo teórico = inicial + suma algebraica).

use crate::domain::account_statement::{AccountStatement, Movement};

fn statement(saldo_final: f64) -> AccountStatement {
    AccountStatement::new(
        "Cuenta nómina".to_string(),
        1000.0,
        vec![
            Movement {
                fecha: "2026-01-05".to_string(),
                concepto: "Nómina".to_string(),
                importe: 2000.0,
            },
            Movement {
                fecha: "2026-01-12".to_string(),
                concepto: "Supermercado".to_string(),
                importe: -250.5,
            },
            Movement {
                fecha: "2026-01-20".to_string(),
                concepto: "Recibo luz".to_string(),
                importe: -80.25,
            },
        ],
        saldo_final,
    )
}

#[test]
fn theoretical_balance_is_initial_plus_algebraic_sum() {
    let st = statement(2669.25);
    assert!((st.saldo_inicial() - 1000.0).abs() < 1e-9);
    assert_eq!(st.movimientos().len(), 3);
    assert!((st.theoretical_balance() - 2669.25).abs() < 1e-9);
}

#[test]
fn reconciled_when_real_matches_theoretical() {
    let st = statement(2669.25);
    assert!(st.difference().abs() < 1e-9);
    assert!(st.is_reconciled());
}

#[test]
fn unreconciled_reports_exact_difference() {
    let st = statement(2600.0);
    let diff = st.difference();
    assert!((diff + 69.25).abs() < 1e-9);
    assert!(!st.is_reconciled());
}
