//! REQ-12-06/13/15: adapter del puerto PdfMovimientosExtractor sobre el
//! crate pdf-extract (aprobado por el humano, pin =0.12). El crate vive
//! SOLO aquí: extrae el texto página a página y aplica el umbral de
//! ilegibilidad de 60 caracteres por página. Los pánicos internos del
//! crate ante PDFs malformados los contiene el catch_unwind del caso de
//! uso `analizar_lote` (REQ-12-14), no este adapter.

use pdf_extract::extract_text_from_mem_by_pages;

use crate::domain::pdf_error::PdfError;
use crate::domain::puertos_pdf::PdfMovimientosExtractor;

/// Umbral de ilegibilidad: caracteres de texto por página (REQ-12-15).
pub const UMBRAL_ILEGIBILIDAD_CHARS_POR_PAGINA: usize = 60;

/// Adapter real de extracción con `pdf_extract`.
pub struct ExtractorPdfExtract;

impl PdfMovimientosExtractor for ExtractorPdfExtract {
    fn paginas_de_texto(
        &self,
        archivo: &str,
        bytes: &[u8],
    ) -> Result<Vec<String>, PdfError> {
        let paginas = extract_text_from_mem_by_pages(bytes).map_err(|error| {
            PdfError::Corrupto {
                archivo: archivo.to_string(),
                motivo: error.to_string(),
            }
        })?;
        if capa_insuficiente(&paginas) {
            return Err(PdfError::Ilegible {
                archivo: archivo.to_string(),
                motivo: format!(
                    "capa de texto insuficiente: {} caracteres en {} página(s) \
                     (umbral: {} caracteres/página)",
                    total_caracteres(&paginas),
                    paginas.len(),
                    UMBRAL_ILEGIBILIDAD_CHARS_POR_PAGINA
                ),
            });
        }
        Ok(paginas)
    }
}

/// True si el PDF está vacío o su capa de texto queda bajo el umbral.
fn capa_insuficiente(paginas: &[String]) -> bool {
    paginas.is_empty()
        || total_caracteres(paginas)
            < UMBRAL_ILEGIBILIDAD_CHARS_POR_PAGINA * paginas.len()
}

fn total_caracteres(paginas: &[String]) -> usize {
    paginas.iter().map(|p| p.chars().count()).sum()
}
