//! REQ-03-02/09: Liability con nombre, saldo pendiente y tasa de interés
//! anual; valores negativos rechazados con `NegativeValueError`.

use serde::{Deserialize, Serialize};

use crate::domain::negative_value::{ensure_non_negative, NegativeValueError};

/// Pasivo: nombre, saldo pendiente y tasa de interés anual en %.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Liability {
    nombre: String,
    saldo_pendiente: f64,
    tasa_interes_anual: f64,
}

impl Liability {
    /// Construye el pasivo validando que ni saldo ni tasa sean negativos.
    pub fn new(
        nombre: String,
        saldo_pendiente: f64,
        tasa_interes_anual: f64,
    ) -> Result<Self, NegativeValueError> {
        ensure_non_negative("Liability", "saldo_pendiente", saldo_pendiente)?;
        ensure_non_negative("Liability", "tasa_interes_anual", tasa_interes_anual)?;
        Ok(Self { nombre, saldo_pendiente, tasa_interes_anual })
    }

    /// Nombre legible del pasivo.
    pub fn nombre(&self) -> &str {
        &self.nombre
    }

    /// Saldo pendiente en euros.
    pub fn saldo_pendiente(&self) -> f64 {
        self.saldo_pendiente
    }

    /// Tasa de interés anual en tanto por ciento.
    pub fn tasa_interes_anual(&self) -> f64 {
        self.tasa_interes_anual
    }
}
