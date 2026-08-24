//! REQ-12-13/14/15: errores nombrados del análisis de PDFs. Ningún pánico
//! cruza la frontera del command: cada variante cita el archivo concreto.

use std::error::Error;
use std::fmt;

/// Error del análisis de un PDF del lote, con archivo y motivo legibles.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PdfError {
    /// El archivo no se pudo abrir/interpretar como PDF.
    Corrupto { archivo: String, motivo: String },
    /// La capa de texto queda bajo el umbral de 60 caracteres por página.
    Ilegible { archivo: String, motivo: String },
    /// Un pánico interno de la extracción quedó aislado con catch_unwind.
    PanicoCapturado { archivo: String, motivo: String },
}

impl PdfError {
    /// Nombre del archivo afectado, para informes del lote.
    pub fn archivo(&self) -> &str {
        match self {
            PdfError::Corrupto { archivo, .. }
            | PdfError::Ilegible { archivo, .. }
            | PdfError::PanicoCapturado { archivo, .. } => archivo,
        }
    }
}

impl fmt::Display for PdfError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PdfError::Corrupto { archivo, motivo } => {
                write!(f, "el archivo \"{archivo}\" está corrupto: {motivo}")
            }
            PdfError::Ilegible { archivo, motivo } => {
                write!(f, "el archivo \"{archivo}\" es ilegible: {motivo}")
            }
            PdfError::PanicoCapturado { archivo, motivo } => {
                write!(
                    f,
                    "el archivo \"{archivo}\" provocó un fallo interno durante la extracción: {motivo}"
                )
            }
        }
    }
}

impl Error for PdfError {}
