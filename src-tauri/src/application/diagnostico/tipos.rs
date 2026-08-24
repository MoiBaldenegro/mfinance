//! REQ-12-04..17: tipos y errores nombrados del diagnóstico PDF. Los tres
//! casos de uso viven en módulos hermanos (analisis / confirmacion) para
//! respetar el límite de 100 líneas; esta pieza es la fachada de dominio.

use serde::{Deserialize, Serialize};

use crate::domain::catalogs::ExpenseCategory;
use crate::domain::comprobante_pdf::MovimientoDetectado;
use crate::domain::month_key::MonthKey;

/// Error nombrado del diagnóstico (subida, análisis o confirmación).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DiagnosticoError {
    /// El mes no cumple YYYY-MM.
    MesInvalido(String),
    /// Fallo del almacén de comprobantes.
    Almacen(String),
    /// Fallo al cargar o guardar el snapshot.
    Snapshot(String),
}

impl DiagnosticoError {
    /// Código estable para cruzar el IPC sin perder trazabilidad.
    pub fn codigo(&self) -> &'static str {
        match self {
            DiagnosticoError::MesInvalido(_) => "MesInvalidoError",
            DiagnosticoError::Almacen(_) => "ComprobantesAlmacenError",
            DiagnosticoError::Snapshot(_) => "SnapshotError",
        }
    }
}

impl std::fmt::Display for DiagnosticoError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DiagnosticoError::MesInvalido(mes) => {
                write!(f, "mes inválido (se espera YYYY-MM): \"{mes}\"")
            }
            DiagnosticoError::Almacen(motivo) => write!(f, "{motivo}"),
            DiagnosticoError::Snapshot(motivo) => write!(f, "{motivo}"),
        }
    }
}

impl std::error::Error for DiagnosticoError {}

/// Valida el mes YYYY-MM recibido por IPC con error nombrado propio.
pub(crate) fn validar_mes(mes: &str) -> Result<MonthKey, DiagnosticoError> {
    MonthKey::parse(mes)
        .map_err(|_| DiagnosticoError::MesInvalido(mes.to_string()))
}

/// Movimiento aceptado en la tabla revisable con su categoría del catálogo
/// cerrado (REQ-12-11), listo para incorporarse al MonthlyRecord.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MovimientoAceptado {
    pub movimiento: MovimientoDetectado,
    pub categoria: ExpenseCategory,
}
