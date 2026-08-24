//! Error nombrado de construcción de MonthlyRecord desde claves crudas
//! (REQ-03-07/08): cada causa de fallo es una variante con su tipo.

use std::error::Error;
use std::fmt;

use crate::domain::errors::{UnknownCategoryError, UnknownSourceError};
use crate::domain::month_key::InvalidMonthKeyError;

/// Rechazo nombrado al construir un registro mensual.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MonthlyRecordError {
    /// La clave de mes no cumple YYYY-MM.
    InvalidMonth(InvalidMonthKeyError),
    /// Fuente de ingreso fuera del catálogo (REQ-03-08).
    UnknownSource(UnknownSourceError),
    /// Categoría de gasto fuera del catálogo (REQ-03-08).
    UnknownCategory(UnknownCategoryError),
}

impl fmt::Display for MonthlyRecordError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidMonth(error) => write!(f, "{}", error),
            Self::UnknownSource(error) => write!(f, "{}", error),
            Self::UnknownCategory(error) => write!(f, "{}", error),
        }
    }
}

impl Error for MonthlyRecordError {}
