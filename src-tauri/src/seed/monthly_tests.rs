//! Tests del seed REQ-04-02 (parte mensual): 12 meses consecutivos con
//! caja positiva y cuotas de deuda decrecientes por amortización.

use crate::domain::catalogs::ExpenseCategory;
use crate::seed;

const MESES_ESPERADOS: [&str; 12] = [
    "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02",
    "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08",
];

#[test]
fn covers_twelve_consecutive_months_ending_current() {
    let snapshot = seed::example_snapshot();
    assert_eq!(snapshot.monthly_records.len(), 12);
    let claves: Vec<String> = snapshot
        .monthly_records
        .iter()
        .map(|record| record.mes().as_str().to_string())
        .collect();
    let esperadas: Vec<String> =
        MESES_ESPERADOS.iter().map(|m| m.to_string()).collect();
    assert_eq!(claves, esperadas, "meses consecutivos y sin repetir");
}

#[test]
fn every_month_saves_money_income_above_expenses() {
    for record in &seed::example_snapshot().monthly_records {
        let income = record.total_income();
        let expense = record.total_expense();
        assert!(income > 0.0 && expense > 0.0, "mes sin datos reales");
        assert!(
            income > expense,
            "en {} el gasto ({expense}) supera el ingreso ({income})",
            record.mes()
        );
    }
}

#[test]
fn debt_payments_shrink_as_loans_amortize() {
    let snapshot = seed::example_snapshot();
    let cuotas: Vec<f64> = snapshot
        .monthly_records
        .iter()
        .map(|record| {
            *record.gasto(ExpenseCategory::CuotasDeuda).unwrap_or(&0.0)
        })
        .collect();
    assert_eq!(cuotas.len(), 12);
    // Amortización: la cuota mensual nunca sube y arranca positiva.
    for par in cuotas.windows(2) {
        assert!(par[1] <= par[0], "la cuota debe ser no creciente");
    }
    assert!(cuotas[0] > 0.0);
}
