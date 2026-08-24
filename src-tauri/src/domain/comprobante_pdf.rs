//! REQ-12-06/10/16: entidades puras del análisis de comprobantes PDF:
//! movimientos detectados, informe por archivo y resultado del lote.
//! Sin dependencias del framework de escritorio ni de extracción PDF:
//! testeable con `cargo test` aislado.

use serde::{Deserialize, Serialize};

/// Movimiento detectado en un extracto (REQ-12-06): fecha normalizada
/// YYYY-MM-DD, comercio/concepto e importe en euros (negativo = cargo).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MovimientoDetectado {
    pub fecha: String,
    pub comercio: String,
    pub importe: f64,
}

impl MovimientoDetectado {
    /// Construye un movimiento detectado.
    pub fn nuevo(fecha: &str, comercio: &str, importe: f64) -> Self {
        Self {
            fecha: fecha.to_string(),
            comercio: comercio.to_string(),
            importe,
        }
    }
}

/// Estado final de un archivo dentro del lote analizado.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EstadoArchivo {
    Analizado,
    Ilegible,
    Corrupto,
    Fallido,
}

/// Golden rule informativa (REQ-12-16/17): nunca bloquea la revisión.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Coherencia {
    Verificada,
    Discrepancia,
    NoVerificable,
}

/// Informe de un archivo del lote: estado, mensaje en español citando el
/// archivo concreto, movimientos extraídos y coherencia si procede.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ResultadoArchivoPdf {
    pub archivo: String,
    pub estado: EstadoArchivo,
    pub mensaje: String,
    pub movimientos: Vec<MovimientoDetectado>,
    pub coherencia: Option<Coherencia>,
}

/// Resultado del análisis completo del mes seleccionado.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ResultadoLote {
    pub mes: String,
    pub archivos: Vec<ResultadoArchivoPdf>,
}
