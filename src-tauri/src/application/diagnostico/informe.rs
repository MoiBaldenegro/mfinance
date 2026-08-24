//! Informes por archivo del lote: error nombrado, pánico aislado y fallo
//! de lectura (REQ-12-13/14). Cada mensaje cita el archivo concreto.

use std::any::Any;

use crate::domain::comprobante_pdf::{EstadoArchivo, ResultadoArchivoPdf};
use crate::domain::pdf_error::PdfError;

/// Informe de error nombrado: estado derivado de la variante de PdfError.
pub(super) fn informe_de_error(
    nombre: &str,
    error: &PdfError,
) -> ResultadoArchivoPdf {
    let estado = match error {
        PdfError::Corrupto { .. } => EstadoArchivo::Corrupto,
        PdfError::Ilegible { .. } => EstadoArchivo::Ilegible,
        PdfError::PanicoCapturado { .. } => EstadoArchivo::Fallido,
    };
    base(nombre, estado, error.to_string())
}

/// Pánico aislado con catch_unwind (REQ-12-14): archivo fallido, lote sano.
pub(super) fn informe_panico(
    nombre: &str,
    panico: Box<dyn Any + Send>,
) -> ResultadoArchivoPdf {
    let motivo = panico
        .downcast_ref::<&'static str>()
        .map(|s| (*s).to_string())
        .or_else(|| panico.downcast_ref::<String>().cloned())
        .unwrap_or_else(|| "pánico desconocido".to_string());
    let error = PdfError::PanicoCapturado { archivo: nombre.to_string(), motivo };
    informe_de_error(nombre, &error)
}

/// No se pudo ni leer el archivo del almacén (fallo de fs).
pub(super) fn informe_fallido(
    nombre: &str,
    motivo: String,
) -> ResultadoArchivoPdf {
    base(nombre, EstadoArchivo::Fallido, motivo)
}

fn base(
    nombre: &str,
    estado: EstadoArchivo,
    mensaje: String,
) -> ResultadoArchivoPdf {
    ResultadoArchivoPdf {
        archivo: nombre.to_string(),
        estado,
        mensaje,
        movimientos: Vec::new(),
        coherencia: None,
    }
}
