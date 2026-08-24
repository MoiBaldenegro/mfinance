//! Errores nombrados del simulador de créditos con mensajes en español
//! (REQ-15-05): el formulario rechaza importe no positivo, plazo cero,
//! tasa negativa y extraordinarios fuera de rango.

use std::fmt;

/// Error de validación del simulador.
#[derive(Debug, Clone, PartialEq)]
pub enum ErrorSimulacion {
    /// El importe del crédito no es positivo.
    ImporteNoPositivo(f64),
    /// El plazo del crédito es cero.
    PlazoInvalido(u32),
    /// La tasa de interés anual es negativa.
    TasaNegativa(f64),
    /// Un extraordinario apunta a un mes fuera de 1..=plazo o con
    /// importe no positivo.
    ExtraordinarioInvalido { mes: u32, plazo_meses: u32 },
}

impl ErrorSimulacion {
    /// Nombre del error que viaja por el IPC como `codigo`.
    pub fn codigo(&self) -> &'static str {
        match self {
            Self::ImporteNoPositivo(_) => "ImporteInvalidoError",
            Self::PlazoInvalido(_) => "PlazoInvalidoError",
            Self::TasaNegativa(_) => "TasaNegativaError",
            Self::ExtraordinarioInvalido { .. } => "ExtraordinarioInvalidoError",
        }
    }
}

impl fmt::Display for ErrorSimulacion {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ImporteNoPositivo(importe) => write!(
                f,
                "El importe debe ser mayor que cero euros (recibido {} €).",
                importe
            ),
            Self::PlazoInvalido(plazo) => write!(
                f,
                "El plazo debe ser mayor que cero meses (recibido {}).",
                plazo
            ),
            Self::TasaNegativa(tasa) => write!(
                f,
                "La tasa de interés no puede ser negativa (recibida {} %).",
                tasa
            ),
            Self::ExtraordinarioInvalido { mes, plazo_meses } => write!(
                f,
                "El pago extraordinario debe aplicarse entre el mes 1 y el \
                 mes {} con importe mayor que cero (mes indicado: {}).",
                plazo_meses, mes
            ),
        }
    }
}

impl std::error::Error for ErrorSimulacion {}
