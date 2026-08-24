//! REQ-03-02/09: Asset con nombre, categoría y valor actual; el valor
//! negativo se rechaza con `NegativeValueError`.

use serde::{Deserialize, Serialize};

use crate::domain::negative_value::{ensure_non_negative, NegativeValueError};

/// Categoría del activo patrimonial.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AssetCategory {
    /// Efectivo, cuentas corrientes, depósitos a la vista.
    Liquido,
    /// Acciones, fondos, ETFs, cripto, etc.
    Inversion,
    /// Inmuebles, terrenos, vehículos.
    Propiedad,
}

/// Activo patrimonial: nombre legible, categoría y valor actual en euros.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Asset {
    nombre: String,
    categoria: AssetCategory,
    valor_actual: f64,
}

impl Asset {
    /// Construye el activo validando que el valor no sea negativo.
    pub fn new(
        nombre: String,
        categoria: AssetCategory,
        valor_actual: f64,
    ) -> Result<Self, NegativeValueError> {
        ensure_non_negative("Asset", "valor_actual", valor_actual)?;
        Ok(Self {
            nombre,
            categoria,
            valor_actual,
        })
    }

    /// Nombre legible del activo.
    pub fn nombre(&self) -> &str {
        &self.nombre
    }

    /// Categoría del activo.
    pub fn categoria(&self) -> AssetCategory {
        self.categoria
    }

    /// Valor actual en euros.
    pub fn valor_actual(&self) -> f64 {
        self.valor_actual
    }
}
