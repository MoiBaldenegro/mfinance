//! REQ-03-09: valores negativos en Asset, Liability o Investment se
//! rechazan con este error nombrado.

use std::error::Error;
use std::fmt;

/// Valor negativo no permitido en una entidad patrimonial.
#[derive(Debug, Clone, PartialEq)]
pub struct NegativeValueError {
    /// Entidad que rechaza: "Asset" | "Liability" | "Investment".
    pub entidad: &'static str,
    /// Campo ofensor: p. ej. "valor_actual" o "saldo_pendiente".
    pub campo: &'static str,
    /// Valor recibido.
    pub valor: f64,
}

impl fmt::Display for NegativeValueError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "valor negativo no permitido: {}.{} = {}",
            self.entidad, self.campo, self.valor
        )
    }
}

impl Error for NegativeValueError {}

/// Guarda compartida por las entidades patrimoniales (REQ-03-09).
pub fn ensure_non_negative(
    entidad: &'static str,
    campo: &'static str,
    valor: f64,
) -> Result<(), NegativeValueError> {
    if valor < 0.0 {
        return Err(NegativeValueError { entidad, campo, valor });
    }
    Ok(())
}
