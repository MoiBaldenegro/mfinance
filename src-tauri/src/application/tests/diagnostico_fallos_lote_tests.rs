//! REQ-12-13/14/15: fallos del lote aislados por archivo — corrupto,
//! ilegible y pánico simulado quedan contenidos citando el archivo
//! concreto SIN abortar el resto del lote (el flujo normal vive en
//! diagnostico_lote_tests.rs).

use super::diagnostico_doubles::almacen_con_tres;
use super::diagnostico_extractor_doble::{paginas_extracto_ok, ModoExtractor};
use super::diagnostico_fixtures::mensaje_cita;
use crate::application::diagnostico::analizar_lote;
use crate::domain::comprobante_pdf::EstadoArchivo;
use crate::domain::pdf_error::PdfError;
use crate::domain::puertos_pdf::PdfMovimientosExtractor;

/// Extractor que falla SOLO con el archivo indicado, según el modo.
struct ExtractorSelectivo {
    archivo_fallo: &'static str,
    modo: ModoExtractor,
}

impl PdfMovimientosExtractor for ExtractorSelectivo {
    fn paginas_de_texto(
        &self,
        archivo: &str,
        _bytes: &[u8],
    ) -> Result<Vec<String>, PdfError> {
        if archivo != self.archivo_fallo {
            return Ok(paginas_extracto_ok());
        }
        match self.modo {
            ModoExtractor::Corrupto => Err(PdfError::Corrupto {
                archivo: archivo.to_string(),
                motivo: "estructura rota".to_string(),
            }),
            ModoExtractor::Ilegible => Err(PdfError::Ilegible {
                archivo: archivo.to_string(),
                motivo: "sin capa de texto".to_string(),
            }),
            ModoExtractor::Panico => panic!("pánico interno del parser PDF"),
            ModoExtractor::Ok => Ok(paginas_extracto_ok()),
        }
    }
}

#[test]
fn pdf_corrupto_nombra_el_archivo_sin_abortar_el_lote() {
    let store = almacen_con_tres();
    // Solo "malo.pdf" (el segundo por orden alfabético) falla.
    let extractor = ExtractorSelectivo { archivo_fallo: "malo.pdf", modo: ModoExtractor::Corrupto };
    let informe = analizar_lote(&store, &extractor, "2026-06").expect("análisis");
    assert_eq!(informe.archivos[0].estado, EstadoArchivo::Analizado);
    let roto = &informe.archivos[1];
    assert_eq!(roto.estado, EstadoArchivo::Corrupto);
    assert!(roto.movimientos.is_empty());
    assert!(mensaje_cita(roto, "malo.pdf"), "mensaje: {}", roto.mensaje);
    assert_eq!(informe.archivos[2].estado, EstadoArchivo::Analizado);
}

#[test]
fn pdf_ilegible_nombra_el_archivo_y_el_lote_continua() {
    let store = almacen_con_tres();
    let extractor = ExtractorSelectivo { archivo_fallo: "otro.pdf", modo: ModoExtractor::Ilegible };
    let informe = analizar_lote(&store, &extractor, "2026-06").expect("análisis");
    let ilegible = &informe.archivos[2];
    assert_eq!(ilegible.estado, EstadoArchivo::Ilegible);
    assert!(mensaje_cita(ilegible, "otro.pdf"), "{}", ilegible.mensaje);
    assert_eq!(informe.archivos[0].estado, EstadoArchivo::Analizado);
    assert_eq!(informe.archivos[1].estado, EstadoArchivo::Analizado);
}

#[test]
fn panico_simulado_queda_aislado_como_fallido_y_el_resto_procesa() {
    let store = almacen_con_tres();
    // El extractor entra en pánico con "malo.pdf": sin contención mataría
    // todo el command (REQ-12-14).
    let extractor = ExtractorSelectivo { archivo_fallo: "malo.pdf", modo: ModoExtractor::Panico };
    let informe =
        analizar_lote(&store, &extractor, "2026-06").expect("el lote continúa");
    let fallido = &informe.archivos[1];
    assert_eq!(fallido.estado, EstadoArchivo::Fallido);
    assert!(mensaje_cita(fallido, "malo.pdf"));
    assert_eq!(informe.archivos[0].estado, EstadoArchivo::Analizado);
    assert_eq!(informe.archivos[2].estado, EstadoArchivo::Analizado);
}
