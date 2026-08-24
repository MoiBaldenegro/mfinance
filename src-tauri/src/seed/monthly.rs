//! Registros mensuales del seed: 2025-09..2026-08 con ingresos y gastos
//! plausibles. Coherencia: los arriendos (650 EUR) salen del piso en
//! alquiler y las cuotas de deuda decrecen al amortizar coche + personal.

use crate::domain::catalogs::{ExpenseCategory, IncomeSource};
use crate::domain::month_key::MonthKey;
use crate::domain::monthly_record::MonthlyRecord;

const MESES: [&str; 12] = [
    "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02",
    "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08",
];

/// Ingresos irregulares pero plausibles por mes.
const FREELANCE: [f64; 12] =
    [300.0, 450.0, 0.0, 520.0, 380.0, 610.0, 0.0, 410.0, 530.0, 290.0, 600.0, 340.0];
const OTROS_INGRESO: [f64; 12] =
    [40.0, 0.0, 120.0, 0.0, 60.0, 0.0, 90.0, 0.0, 45.0, 110.0, 0.0, 75.0];

pub fn monthly_records() -> Vec<MonthlyRecord> {
    (0..MESES.len()).map(record_at).collect()
}

fn record_at(index: usize) -> MonthlyRecord {
    let i = index as f64;
    MonthlyRecord::new(
        month_key(index),
        [
            (IncomeSource::Salario, 2450.0 + 25.0 * i),
            (IncomeSource::Freelance, FREELANCE[index]),
            (IncomeSource::Arriendos, 650.0),
            (IncomeSource::Otros, OTROS_INGRESO[index]),
        ],
        [
            (ExpenseCategory::Vivienda, 980.0),
            (ExpenseCategory::Alimentacion, 380.0 + 15.0 * (index % 3) as f64),
            (ExpenseCategory::Transporte, 150.0 + 7.0 * (index % 4) as f64),
            // Coche (~258 EUR) + personal (~106 EUR) amortizando.
            (ExpenseCategory::CuotasDeuda, 364.0 - 5.0 * i),
            (ExpenseCategory::Ocio, 140.0 + 10.0 * (index % 5) as f64),
            (ExpenseCategory::Otros, 55.0 + 5.0 * (index % 3) as f64),
        ],
    )
}

fn month_key(index: usize) -> MonthKey {
    MonthKey::parse(MESES[index]).expect("claves del seed son válidas")
}
