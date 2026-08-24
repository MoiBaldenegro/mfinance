//! Puertos del diagnóstico PDF definidos por el núcleo (design.md F12):
//! almacenamiento de comprobantes y extracción de texto página a página.
//! Los adapters de infrastructure/ los implementan; el crate pdf-extract
//! vive SOLO detrás de `PdfMovimientosExtractor`.

use std::error::Error;
use std::fmt;

use crate::domain::pdf_error::PdfError;

/// Fallo nombrado del almacenamiento de comprobantes (guardar/listar/leer).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ComprobantesStoreError {
    pub motivo: String,
}

impl ComprobantesStoreError {
    /// Construye el error con su motivo legible en español.
    pub fn nuevo(motivo: &str) -> Self {
        Self { motivo: motivo.to_string() }
    }
}

impl fmt::Display for ComprobantesStoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "almacén de comprobantes: {}", self.motivo)
    }
}

impl Error for ComprobantesStoreError {}

/// Puerto de almacenamiento: guarda los PDFs del mes conservando el nombre
/// original (REQ-12-05) y los recupera para analizarlos.
pub trait ComprobantesStore {
    /// Guarda los bytes bajo `<mes>/<nombre>` y devuelve el nombre guardado.
    fn guardar(
        &mut self,
        mes: &str,
        nombre_original: &str,
        bytes: &[u8],
    ) -> Result<String, ComprobantesStoreError>;

    /// Lista los nombres de PDF almacenados para el mes (ordenados).
    fn listar(&self, mes: &str) -> Result<Vec<String>, ComprobantesStoreError>;

    /// Lee los bytes de un comprobante del mes.
    fn leer(&self, mes: &str, nombre: &str) -> Result<Vec<u8>, ComprobantesStoreError>;
}

/// Puerto de extracción: bytes de un PDF → texto por páginas. El adapter
/// real controla el umbral de ilegibilidad (60 caracteres por página).
pub trait PdfMovimientosExtractor {
    fn paginas_de_texto(
        &self,
        archivo: &str,
        bytes: &[u8],
    ) -> Result<Vec<String>, PdfError>;
}
