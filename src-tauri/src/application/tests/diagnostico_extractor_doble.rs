//! Doble del puerto PdfMovimientosExtractor: páginas fijas o fallo
//! simulado (Corrupto / Ilegible / pánico) para los suites del lote.

use crate::domain::pdf_error::PdfError;
use crate::domain::puertos_pdf::PdfMovimientosExtractor;

/// Modo de fallo del extractor falso.
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum ModoExtractor {
    Ok,
    Corrupto,
    Ilegible,
    Panico,
}

/// Extractor falso: devuelve las páginas fijadas o simula el fallo pedido.
pub struct ExtractorFalso {
    pub modo: ModoExtractor,
    pub paginas: Vec<String>,
}

impl PdfMovimientosExtractor for ExtractorFalso {
    fn paginas_de_texto(
        &self,
        archivo: &str,
        _bytes: &[u8],
    ) -> Result<Vec<String>, PdfError> {
        match self.modo {
            ModoExtractor::Ok => Ok(self.paginas.clone()),
            ModoExtractor::Corrupto => Err(PdfError::Corrupto {
                archivo: archivo.to_string(),
                motivo: "xref inválido".to_string(),
            }),
            ModoExtractor::Ilegible => Err(PdfError::Ilegible {
                archivo: archivo.to_string(),
                motivo: "capa de texto insuficiente".to_string(),
            }),
            ModoExtractor::Panico => panic!("pánico simulado del parser"),
        }
    }
}

/// Páginas tipo extracto usadas por varios suites del lote: dos
/// movimientos y saldos que cuadran (golden rule Verificada).
pub fn paginas_extracto_ok() -> Vec<String> {
    vec![vec![
        "BANCO EJEMPLO EXTRACTO MENSUAL",
        "Saldo inicial 1.000,00",
        "01/06/2026 SUPERMERCADO ACME 45,30-",
        "03/06/2026 NOMINA EMPRESA 2.350,00",
        "Estimado cliente gracias por su confianza",
        "Total movimientos 3",
        "Saldo final 3.304,70",
    ]
    .join("\n")]
}
