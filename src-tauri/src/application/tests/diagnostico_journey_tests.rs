//! REQ-12-21: journey completo subir→analizar→verificar→actualizar con
//! los adapters REALES: almacén fs en directorio temporal, extracción
//! pdf-extract sobre el fixture sintético de diagnostico_fixtures.rs y
//! parser puro. Ningún Documents real es tocado.

use super::diagnostico_fixtures::{aceptar, registro_de, LINEAS_EXTRACTO};
use super::memory_repository::MemoryRepository;
use crate::application::diagnostico::{
    analizar_lote, confirmar_movimientos, subir_comprobantes,
};
use crate::domain::catalogs::ExpenseCategory;
use crate::domain::comprobante_pdf::{Coherencia, EstadoArchivo};
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;
use crate::infrastructure::comprobantes_fs::ComprobantesFsRepository;
use crate::infrastructure::pdf_extractor::ExtractorPdfExtract;
use crate::infrastructure::test_support::{cleanup, construir_pdf, temp_dir};

#[test]
fn journey_completo_subir_analizar_verificar_y_actualizar() {
    let dir = temp_dir("journey_f12");

    // 1. SUBIR: tres PDFs asociados al mes seleccionado. La sesión
    // fija primero el perfil activo (REQ-21-07), como hace lib.rs.
    let mut store = ComprobantesFsRepository::new(dir.join("comprobantes"));
    store.set_perfil("journey_f21".to_string());
    let subidos = subir_comprobantes(
        &mut store,
        "2026-06",
        &[
            (
                "escaneado.pdf".to_string(),
                construir_pdf(&["DOCUMENTO ESCANEADO SIN CAPA DE TEXTO"]),
            ),
            ("extracto-junio.pdf".to_string(), construir_pdf(LINEAS_EXTRACTO)),
            ("roto.pdf".to_string(), Vec::new()),
        ],
    )
    .expect("la subida guarda los tres archivos");
    assert_eq!(subidos.len(), 3);

    // 2. ANALIZAR: un resultado por archivo, el lote no se aborta.
    let extractor = ExtractorPdfExtract;
    let informe =
        analizar_lote(&store, &extractor, "2026-06").expect("análisis del lote");
    assert_eq!(
        informe.archivos[0].estado,
        EstadoArchivo::Ilegible,
        "escaneado bajo el umbral de 60 caracteres/página"
    );
    assert!(informe.archivos[0].mensaje.contains("escaneado.pdf"));
    assert_eq!(informe.archivos[2].estado, EstadoArchivo::Corrupto);
    assert!(informe.archivos[2].mensaje.contains("roto.pdf"));

    // 3. VERIFICAR DATOS: fechas normalizadas, importes exactos,
    // concepto multilínea y golden rule Verificada.
    let bueno = &informe.archivos[1];
    assert_eq!(bueno.estado, EstadoArchivo::Analizado, "{}", bueno.mensaje);
    assert_eq!(bueno.movimientos.len(), 4);
    assert_eq!(bueno.coherencia, Some(Coherencia::Verificada));
    assert_eq!(bueno.movimientos[0].fecha, "2026-06-01");
    assert_eq!(bueno.movimientos[0].comercio, "SUPERMERCADO ACME");
    assert!((bueno.movimientos[0].importe - -45.30).abs() < 1e-9);
    assert_eq!(
        bueno.movimientos[2].comercio,
        "GASOLINA REPSOL ESTACION NUMERO 7 CARRETERA N-III"
    );
    assert!((bueno.movimientos[2].importe - -23.75).abs() < 1e-9);

    // 4. ACTUALIZAR HERRAMIENTA: confirmar incorpora al MonthlyRecord
    // del mes y persiste el snapshot.
    let mut repo = MemoryRepository::default();
    repo.stored = Some(FinanceSnapshot::new());
    let aceptados = vec![
        aceptar(&bueno.movimientos[0], ExpenseCategory::Alimentacion),
        aceptar(&bueno.movimientos[2], ExpenseCategory::Transporte),
        aceptar(&bueno.movimientos[3], ExpenseCategory::Vivienda),
    ];
    let snapshot =
        confirmar_movimientos(&mut repo, "2026-06", &aceptados)
            .expect("confirmación persistida");
    let registro = registro_de(&snapshot, "2026-06");
    assert_eq!(registro.gasto(ExpenseCategory::Alimentacion), Some(&45.30));
    assert_eq!(registro.gasto(ExpenseCategory::Transporte), Some(&23.75));
    assert_eq!(registro.gasto(ExpenseCategory::Vivienda), Some(&800.00));
    assert_eq!(repo.load().expect("recarga"), snapshot);

    cleanup(&dir);
}
