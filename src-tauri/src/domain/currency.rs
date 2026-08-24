//! REQ-19-01/03: catálogo cerrado de divisas del agregado financiero.
//! Espejo exacto en `src/domain/entities/moneda.ts`; sin dependencias
//! externas ni del framework de escritorio (dominio puro).

use serde::{Deserialize, Serialize};

/// Moneda de visualización del snapshot: re-etiqueta la presentación,
/// nunca convierte importes.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Currency {
    /// Peso mexicano (defecto del target principal).
    Mxn,
    /// Dólar estadounidense.
    Usd,
    /// Euro.
    Eur,
}

impl Default for Currency {
    fn default() -> Self {
        Currency::Mxn
    }
}

impl Currency {
    /// Código del catálogo tal cual viaja por el cable y espeja la TS.
    pub fn as_str(self) -> &'static str {
        match self {
            Currency::Mxn => "MXN",
            Currency::Usd => "USD",
            Currency::Eur => "EUR",
        }
    }
}
