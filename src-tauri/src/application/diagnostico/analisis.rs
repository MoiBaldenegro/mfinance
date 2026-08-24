//! REQ-12-04..15: subir y analizar lotes de comprobantes PDF.
//! `analizar_lote` itera archivo a archivo aislando cada extracción con
//! `catch_unwind` (REQ-12-14): un fallo o pánico jamás aborta el lote.

use std::panic::{catch_unwind, AssertUnwindSafe};

use super::informe::{informe_de_error, informe_fallido, informe_panico};
use super::parser_extracto;
use super::tipos::{validar_mes, DiagnosticoError};
use crate::domain::comprobante_pdf::{EstadoArchivo, ResultadoArchivoPdf, ResultadoLote};
use crate::domain::pdf_error::PdfError;
use crate::domain::puertos_pdf::{ComprobantesStore, PdfMovimientosExtractor};

/// Guarda los archivos subidos asociándolos al mes seleccionado
/// (REQ-12-04/05) y devuelve los nombres almacenados.
pub fn subir_comprobantes(
    store: &mut dyn ComprobantesStore,
    mes: &str,
    archivos: &[(String, Vec<u8>)],
) -> Result<Vec<String>, DiagnosticoError> {
    let clave = validar_mes(mes)?;
    let mut guardados = Vec::new();
    for (nombre, bytes) in archivos {
        let guardado = store
            .guardar(clave.as_str(), nombre, bytes)
            .map_err(|e| DiagnosticoError::Almacen(e.to_string()))?;
        guardados.push(guardado);
    }
    Ok(guardados)
}

/// Analiza todos los PDFs del mes (REQ-12-06/13/14/15): un resultado por
/// archivo citando el nombre concreto; el lote continúa siempre.
pub fn analizar_lote(
    store: &dyn ComprobantesStore,
    extractor: &dyn PdfMovimientosExtractor,
    mes: &str,
) -> Result<ResultadoLote, DiagnosticoError> {
    let clave = validar_mes(mes)?;
    let nombres = store
        .listar(clave.as_str())
        .map_err(|e| DiagnosticoError::Almacen(e.to_string()))?;
    let mut archivos = Vec::new();
    for nombre in nombres {
        archivos.push(analizar_archivo(store, extractor, clave.as_str(), &nombre));
    }
    Ok(ResultadoLote { mes: clave.as_str().to_string(), archivos })
}

/// Analiza UN archivo con contención total de fallos y pánicos.
fn analizar_archivo(
    store: &dyn ComprobantesStore,
    extractor: &dyn PdfMovimientosExtractor,
    mes: &str,
    nombre: &str,
) -> ResultadoArchivoPdf {
    let bytes = match store.leer(mes, nombre) {
        Err(error) => {
            return informe_fallido(
                nombre,
                format!("no se pudo leer el archivo \"{nombre}\": {}", error.motivo),
            );
        }
        Ok(bytes) => bytes,
    };
    let extraido =
        catch_unwind(AssertUnwindSafe(|| extraer(extractor, nombre, &bytes)));
    match extraido {
        Ok(Ok(resultado)) => resultado,
        Ok(Err(error)) => informe_de_error(nombre, &error),
        Err(panico) => informe_panico(nombre, panico),
    }
}

/// Extrae texto y parsea movimientos de un archivo sano.
fn extraer(
    extractor: &dyn PdfMovimientosExtractor,
    nombre: &str,
    bytes: &[u8],
) -> Result<ResultadoArchivoPdf, PdfError> {
    let paginas = extractor.paginas_de_texto(nombre, bytes)?;
    let parseo = parser_extracto::parsear_extracto(&paginas);
    let mensaje = if parseo.movimientos.is_empty() {
        format!("sin movimientos reconocibles en \"{nombre}\"")
    } else {
        format!(
            "{} movimiento(s) detectados en \"{nombre}\"",
            parseo.movimientos.len()
        )
    };
    Ok(ResultadoArchivoPdf {
        archivo: nombre.to_string(),
        estado: EstadoArchivo::Analizado,
        mensaje,
        movimientos: parseo.movimientos,
        coherencia: Some(parseo.coherencia),
    })
}
