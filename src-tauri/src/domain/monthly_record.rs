//! REQ-03-01/08: MonthlyRecord con clave YYYY-MM, ingresos por fuente y
//! gastos por categoría; entradas fuera de catálogo se rechazan.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::domain::catalogs::{ExpenseCategory, IncomeSource};
use crate::domain::month_key::MonthKey;
pub use crate::domain::monthly_record_error::MonthlyRecordError;

/// Ingresos y gastos de un mes, siempre indexados por catálogos exactos.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MonthlyRecord {
    mes: MonthKey,
    ingresos: BTreeMap<IncomeSource, f64>,
    gastos: BTreeMap<ExpenseCategory, f64>,
}

impl MonthlyRecord {
    /// Construye desde pares ya tipados; meses sin datos abren a cero.
    pub fn new(
        mes: MonthKey,
        ingresos: impl IntoIterator<Item = (IncomeSource, f64)>,
        gastos: impl IntoIterator<Item = (ExpenseCategory, f64)>,
    ) -> Self {
        Self {
            mes,
            ingresos: ingresos.into_iter().collect(),
            gastos: gastos.into_iter().collect(),
        }
    }

    /// Construye desde claves crudas rechazando lo fuera de catálogo.
    pub fn from_raw(
        mes: &str,
        ingresos: &[(&str, f64)],
        gastos: &[(&str, f64)],
    ) -> Result<Self, MonthlyRecordError> {
        let month =
            MonthKey::parse(mes).map_err(MonthlyRecordError::InvalidMonth)?;
        let mut income_map = BTreeMap::new();
        for (key, amount) in ingresos {
            let source = IncomeSource::parse(key)
                .map_err(MonthlyRecordError::UnknownSource)?;
            income_map.insert(source, *amount);
        }
        let mut expense_map = BTreeMap::new();
        for (key, amount) in gastos {
            let category = ExpenseCategory::parse(key)
                .map_err(MonthlyRecordError::UnknownCategory)?;
            expense_map.insert(category, *amount);
        }
        Ok(Self { mes: month, ingresos: income_map, gastos: expense_map })
    }

    /// Clave YYYY-MM del registro.
    pub fn mes(&self) -> &MonthKey {
        &self.mes
    }

    /// Importe registrado para una fuente, si existe.
    pub fn ingreso(&self, source: IncomeSource) -> Option<&f64> {
        self.ingresos.get(&source)
    }

    /// Importe registrado para una categoría, si existe.
    pub fn gasto(&self, category: ExpenseCategory) -> Option<&f64> {
        self.gastos.get(&category)
    }

    /// Suma de ingresos del mes.
    pub fn total_income(&self) -> f64 {
        self.ingresos.values().sum::<f64>()
    }

    /// Suma de gastos del mes.
    pub fn total_expense(&self) -> f64 {
        self.gastos.values().sum::<f64>()
    }

    /// Referencia al mapa de ingresos (para proyecciones).
    pub fn ingresos(&self) -> &BTreeMap<IncomeSource, f64> {
        &self.ingresos
    }

    /// Referencia al mapa de gastos (para proyecciones).
    pub fn gastos(&self) -> &BTreeMap<ExpenseCategory, f64> {
        &self.gastos
    }
}
