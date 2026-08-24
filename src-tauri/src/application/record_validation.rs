//! Revalidación de los registros mensuales importados: la clave de mes
//! se reconstruye con `MonthKey::parse` (serde derivado no valida el
//! formato YYYY-MM ni el rango 01..=12).

use crate::application::import_validation::rejected;
use crate::domain::catalogs::{ExpenseCategory, IncomeSource};
use crate::domain::month_key::MonthKey;
use crate::domain::monthly_record::MonthlyRecord;
use crate::domain::repository_errors::SnapshotImportError;
use crate::domain::snapshot::FinanceSnapshot;

/// Reconstruye cada registro validando su clave de mes. Los mapas ya son
/// tipados por catálogo (serde los rechaza fuera de catálogo), así que se
/// reensamblan recorriendo los catálogos exactos.
pub fn records(
    raw: &FinanceSnapshot,
) -> Result<Vec<MonthlyRecord>, SnapshotImportError> {
    raw.monthly_records
        .iter()
        .map(|record| {
            let mes = MonthKey::parse(record.mes().as_str())
                .map_err(|error| rejected("mes", error))?;
            let ingresos = entries_income(record);
            let gastos = entries_expense(record);
            Ok(MonthlyRecord::new(mes, ingresos, gastos))
        })
        .collect()
}

fn entries_income(record: &MonthlyRecord) -> Vec<(IncomeSource, f64)> {
    IncomeSource::ALL
        .iter()
        .filter_map(|&source| {
            record.ingreso(source).map(|&importe| (source, importe))
        })
        .collect()
}

fn entries_expense(record: &MonthlyRecord) -> Vec<(ExpenseCategory, f64)> {
    ExpenseCategory::ALL
        .iter()
        .filter_map(|&category| {
            record.gasto(category).map(|&importe| (category, importe))
        })
        .collect()
}
