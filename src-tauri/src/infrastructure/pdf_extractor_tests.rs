//! REQ-12-06/13/15: tests del adapter real pdf-extract sobre fixtures
//! sintéticos generados en memoria: extracción por páginas, umbral de
//! ilegibilidad de 60 caracteres/página y error nombrado ante corruptos.

use super::pdf_extractor::{ExtractorPdfExtract, UMBRAL_ILEGIBILIDAD_CHARS_POR_PAGINA};
use super::test_support::construir_pdf;
use crate::domain::pdf_error::PdfError;
use crate::domain::puertos_pdf::PdfMovimientosExtractor;

#[test]
fn el_umbral_de_ilegibilidad_es_sesenta_caracteres_por_pagina() {
    assert_eq!(UMBRAL_ILEGIBILIDAD_CHARS_POR_PAGINA, 60);
}

#[test]
fn extrae_el_texto_de_un_fixture_sintetico_valido() {
    let pdf = construir_pdf(&[
        "01/06/2026 SUPERMERCADO ACME 45,30-",
        "03/06/2026 NOMINA EMPRESA 2.350,00",
        "Saldo final 3.304,70",
    ]);
    let paginas = ExtractorPdfExtract
        .paginas_de_texto("extracto.pdf", &pdf)
        .expect("extracción correcta");
    assert_eq!(paginas.len(), 1);
    let texto = &paginas[0];
    assert!(texto.contains("SUPERMERCADO ACME"), "texto: {texto}");
    assert!(texto.contains("2.350,00"), "texto: {texto}");
}

#[test]
fn un_pdf_con_capa_de_texto_escasa_se_clasifica_ilegible() {
    // ~19 caracteres en una página: muy por debajo del umbral.
    let pdf = construir_pdf(&["DOCUMENTO ESCANEADO"]);
    let error = ExtractorPdfExtract
        .paginas_de_texto("escaneado.pdf", &pdf)
        .expect_err("bajo el umbral");
    match error {
        PdfError::Ilegible { archivo, motivo } => {
            assert_eq!(archivo, "escaneado.pdf");
            assert!(!motivo.is_empty());
        }
        otro => panic!("se esperaba Ilegible, fue {otro:?}"),
    }
}

#[test]
fn bytes_que_no_son_un_pdf_producen_error_corrupto() {
    let error = ExtractorPdfExtract
        .paginas_de_texto("roto.pdf", &[])
        .expect_err("bytes vacíos no son un PDF");
    match error {
        PdfError::Corrupto { archivo, .. } => assert_eq!(archivo, "roto.pdf"),
        otro => panic!("se esperaba Corrupto, fue {otro:?}"),
    }
}
