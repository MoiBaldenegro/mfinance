//! REQ-12-06: flujo normal del lote — analizar_lote procesa TODOS los
//! archivos del mes cuando todo va bien. Los fallos aislados por archivo
//! (corrupto/ilegible/pánico) viven en diagnostico_fallos_lote_tests.rs.

use super::diagnostico_doubles::almacen_con_tres;
use super::diagnostico_extractor_doble::{paginas_extracto_ok, ExtractorFalso, ModoExtractor};
use crate::application::diagnostico::analizar_lote;
use crate::domain::comprobante_pdf::EstadoArchivo;
use crate::domain::puertos_pdf::ComprobantesStore;

#[test]
fn lote_correcto_analiza_todos_los_archivos_del_mes() {
    let store = almacen_con_tres();
    let extractor =
        ExtractorFalso { modo: ModoExtractor::Ok, paginas: paginas_extracto_ok() };
    let informe = analizar_lote(&store, &extractor, "2026-06").expect("análisis");
    assert_eq!(informe.mes, "2026-06");
    assert_eq!(informe.archivos.len(), 3);
    for resultado in &informe.archivos {
        assert_eq!(resultado.estado, EstadoArchivo::Analizado);
        assert_eq!(resultado.movimientos.len(), 2);
    }
}

#[test]
fn journey_subir_analizar_verificar_actualizar_en_una_sola_linea_de_flujo() {
    // Versión con dobles del REQ-12-21 (la real con pdf-extract vive en
    // diagnostico_journey_tests.rs): subir y analizar encadenados.
    let mut store = super::diagnostico_doubles::AlmacenFalso::default();
    store
        .guardar("2026-06", "extracto.pdf", b"%PDF-1.4")
        .expect("subida");
    let extractor = ExtractorFalso {
        modo: ModoExtractor::Ok,
        paginas: paginas_extracto_ok(),
    };
    let informe = analizar_lote(&store, &extractor, "2026-06").expect("análisis");
    assert_eq!(informe.archivos.len(), 1);
}
