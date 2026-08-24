//! Clave de mes YYYY-MM (REQ-03-01): valida formato y rango 01..=12.

use std::error::Error;
use std::fmt;

use serde::{Deserialize, Serialize};

/// Clave de mes inválida: no cumple YYYY-MM o el mes sale de 01..=12.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidMonthKeyError {
    /// Texto recibido tal cual.
    pub valor: String,
}

impl fmt::Display for InvalidMonthKeyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "clave de mes inválida (se espera YYYY-MM): \"{}\"", self.valor)
    }
}

impl Error for InvalidMonthKeyError {}

/// Identificador inmutable de mes con formato YYYY-MM validado.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub struct MonthKey(String);

impl MonthKey {
    /// Valida `YYYY-MM`: año de 4 dígitos y mes entre 01 y 12.
    pub fn parse(raw: &str) -> Result<Self, InvalidMonthKeyError> {
        let invalid = || InvalidMonthKeyError { valor: raw.to_string() };
        let parts: Vec<&str> = raw.split('-').collect();
        if parts.len() != 2 {
            return Err(invalid());
        }
        let (year, month) = (parts[0], parts[1]);
        let digits = |text: &str| text.bytes().all(|byte| byte.is_ascii_digit());
        if year.len() != 4 || !digits(year) {
            return Err(invalid());
        }
        if month.len() != 2 || !digits(month) {
            return Err(invalid());
        }
        let month_number = match month.parse::<u8>() {
            Ok(number) => number,
            Err(_) => return Err(invalid()),
        };
        if !(1..=12).contains(&month_number) {
            return Err(invalid());
        }
        Ok(Self(raw.to_string()))
    }

    /// Clave canónica en texto.
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for MonthKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}
