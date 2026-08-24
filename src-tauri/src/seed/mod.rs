//! Seed REQ-04-02: FinanceSnapshot de ejemplo realista y coherente
//! (12 meses de registros ligados a la deuda y al alquiler, 3 activos,
//! 3 pasivos con tasas distintas, inversiones en las 3 familias y 2
//! estados de cuenta conciliados), listo para indicadores y gráficas.

mod monthly;
mod patrimony;

#[cfg(test)]
mod monthly_tests;
#[cfg(test)]
mod patrimony_tests;

use crate::domain::currency::Currency;
use crate::domain::snapshot::{DebtStrategy, FinanceSnapshot, StrategySettings};

/// Ejemplo determinista: mismas cifras en cada ejecución, sin reloj ni
/// azar, para que round-trips y tests sean estables.
pub fn example_snapshot() -> FinanceSnapshot {
    FinanceSnapshot {
        monthly_records: monthly::monthly_records(),
        assets: patrimony::assets(),
        liabilities: patrimony::liabilities(),
        investments: patrimony::investments(),
        account_statements: patrimony::account_statements(),
        strategy: StrategySettings {
            debt_strategy: DebtStrategy::Avalanche,
            extra_monthly_payment: 100.0,
            currency: Currency::Mxn,
        },
        assessments: Vec::new(),
    }
}
