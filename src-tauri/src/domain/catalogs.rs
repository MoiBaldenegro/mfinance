//! Catálogos exactos del requerimiento (REQ-03-01/08): fuentes de ingreso
//! y categorías de gasto. Fuera de catálogo ⇒ error nombrado.

use serde::{Deserialize, Serialize};

use crate::domain::errors::{UnknownCategoryError, UnknownSourceError};

/// Fuente de ingreso mensual admitida.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum IncomeSource {
    Salario,
    Freelance,
    Arriendos,
    Otros,
}

impl IncomeSource {
    /// Catálogo exacto, en el orden del requerimiento.
    pub const ALL: [IncomeSource; 4] = [
        IncomeSource::Salario,
        IncomeSource::Freelance,
        IncomeSource::Arriendos,
        IncomeSource::Otros,
    ];

    /// Clave canónica: minúsculas sin tildes.
    pub fn as_str(self) -> &'static str {
        match self {
            IncomeSource::Salario => "salario",
            IncomeSource::Freelance => "freelance",
            IncomeSource::Arriendos => "arriendos",
            IncomeSource::Otros => "otros",
        }
    }

    /// Rechaza claves fuera de catálogo con error nombrado (REQ-03-08).
    pub fn parse(raw: &str) -> Result<Self, UnknownSourceError> {
        Self::ALL
            .iter()
            .find(|source| source.as_str() == raw)
            .copied()
            .ok_or_else(|| UnknownSourceError::new(raw))
    }
}

/// Categoría de gasto mensual admitida.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum ExpenseCategory {
    Vivienda,
    Alimentacion,
    Transporte,
    CuotasDeuda,
    Ocio,
    Otros,
}

impl ExpenseCategory {
    /// Catálogo exacto, en el orden del requerimiento.
    pub const ALL: [ExpenseCategory; 6] = [
        ExpenseCategory::Vivienda,
        ExpenseCategory::Alimentacion,
        ExpenseCategory::Transporte,
        ExpenseCategory::CuotasDeuda,
        ExpenseCategory::Ocio,
        ExpenseCategory::Otros,
    ];

    /// Clave canónica: minúsculas sin tildes.
    pub fn as_str(self) -> &'static str {
        match self {
            ExpenseCategory::Vivienda => "vivienda",
            ExpenseCategory::Alimentacion => "alimentacion",
            ExpenseCategory::Transporte => "transporte",
            ExpenseCategory::CuotasDeuda => "cuotas_deuda",
            ExpenseCategory::Ocio => "ocio",
            ExpenseCategory::Otros => "otros",
        }
    }

    /// Rechaza claves fuera de catálogo con error nombrado (REQ-03-08).
    pub fn parse(raw: &str) -> Result<Self, UnknownCategoryError> {
        Self::ALL
            .iter()
            .find(|category| category.as_str() == raw)
            .copied()
            .ok_or_else(|| UnknownCategoryError::new(raw))
    }
}
