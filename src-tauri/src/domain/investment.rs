//! REQ-03-03: Investment con familia (renta_fija renta_variable
//! finca_raiz), aporte mensual, valor actual y tasa esperada editable.

use serde::{Deserialize, Serialize};

use crate::domain::errors::UnknownFamilyError;
use crate::domain::negative_value::{ensure_non_negative, NegativeValueError};

/// Familia de inversión admitida.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum InvestmentFamily {
    RentaFija,
    RentaVariable,
    FincaRaiz,
}

impl InvestmentFamily {
    /// Catálogo exacto, en el orden del requerimiento.
    pub const ALL: [InvestmentFamily; 3] = [
        InvestmentFamily::RentaFija,
        InvestmentFamily::RentaVariable,
        InvestmentFamily::FincaRaiz,
    ];

    /// Clave canónica: minúsculas sin tildes y con guion bajo.
    pub fn as_str(self) -> &'static str {
        match self {
            InvestmentFamily::RentaFija => "renta_fija",
            InvestmentFamily::RentaVariable => "renta_variable",
            InvestmentFamily::FincaRaiz => "finca_raiz",
        }
    }

    /// Rechaza familias fuera de catálogo con error nombrado.
    pub fn parse(raw: &str) -> Result<Self, UnknownFamilyError> {
        Self::ALL
            .iter()
            .find(|family| family.as_str() == raw)
            .copied()
            .ok_or_else(|| UnknownFamilyError::new(raw))
    }
}

/// Inversión por familia con aporte mensual y tasa esperada editable.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Investment {
    familia: InvestmentFamily,
    aporte_mensual: f64,
    valor_actual: f64,
    tasa_esperada_anual: f64,
}

impl Investment {
    /// Construye validando que ni aporte, ni valor actual, ni tasa sean
    /// negativos.
    pub fn new(
        familia: InvestmentFamily,
        aporte_mensual: f64,
        valor_actual: f64,
        tasa_esperada_anual: f64,
    ) -> Result<Self, NegativeValueError> {
        ensure_non_negative("Investment", "aporte_mensual", aporte_mensual)?;
        ensure_non_negative("Investment", "valor_actual", valor_actual)?;
        ensure_non_negative("Investment", "tasa_esperada_anual", tasa_esperada_anual)?;
        Ok(Self { familia, aporte_mensual, valor_actual, tasa_esperada_anual })
    }

    /// Familia del catálogo.
    pub fn familia(&self) -> InvestmentFamily {
        self.familia
    }

    /// Aporte mensual en euros.
    pub fn aporte_mensual(&self) -> f64 {
        self.aporte_mensual
    }

    /// Valor actual en euros.
    pub fn valor_actual(&self) -> f64 {
        self.valor_actual
    }

    /// Tasa esperada anual editable, en tanto por ciento.
    pub fn tasa_esperada_anual(&self) -> f64 {
        self.tasa_esperada_anual
    }
}
