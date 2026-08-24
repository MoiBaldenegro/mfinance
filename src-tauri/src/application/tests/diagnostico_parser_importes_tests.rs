//! REQ-12-18/19: importes en formato español con exactitud de céntimos y
//! normalización de fechas dd/mm/yyyy, dd/mm/yy e ISO. Tests escritos
//! ANTES de la implementación (ciclo rojo/verde).

use crate::application::diagnostico::parser_importe::importe_a_centimos;
use crate::application::diagnostico::parser_fecha::normalizar_fecha;

#[test]
fn importe_espanol_basico_con_millares_y_decimales() {
    assert_eq!(importe_a_centimos("1.234,56"), Some(123_456));
    assert_eq!(importe_a_centimos("1.234.567,89"), Some(123_456_789));
    assert_eq!(importe_a_centimos("45,30"), Some(4_530));
}

#[test]
fn importe_millares_sin_decimales_es_ambiguo_resuelto_como_grupos_de_tres() {
    // Grupos de tres dígitos tras el punto = separador de millares.
    assert_eq!(importe_a_centimos("1.234"), Some(123_400));
    assert_eq!(importe_a_centimos("12.345"), Some(1_234_500));
    // Grupo que no es de tres dígitos no es un importe válido.
    assert_eq!(importe_a_centimos("12.34"), None);
}

#[test]
fn importe_cero_y_simbolos() {
    assert_eq!(importe_a_centimos("0,00"), Some(0));
    assert_eq!(importe_a_centimos("89,90 €"), Some(8_990));
    assert_eq!(importe_a_centimos("€ 89,90"), Some(8_990));
}

#[test]
fn importes_negativos_signo_trailing_minus_y_parentesis() {
    assert_eq!(importe_a_centimos("-237,08"), Some(-23_708));
    assert_eq!(importe_a_centimos("237,08-"), Some(-23_708));
    assert_eq!(importe_a_centimos("(237,08)"), Some(-23_708));
}

#[test]
fn importe_con_nbsp_como_separador() {
    let nbsp = '\u{00a0}';
    assert_eq!(
        importe_a_centimos(&format!("1{nbsp}234{nbsp}567,89")),
        Some(123_456_789)
    );
}

#[test]
fn guiones_y_basura_no_son_importes() {
    assert_eq!(importe_a_centimos("-"), None);
    assert_eq!(importe_a_centimos("—"), None);
    assert_eq!(importe_a_centimos(""), None);
    assert_eq!(importe_a_centimos("abc"), None);
}

#[test]
fn fechas_dd_mm_yyyy_se_normalizan_con_ceros() {
    assert_eq!(normalizar_fecha("01/06/2026"), Some("2026-06-01".into()));
    assert_eq!(normalizar_fecha("25/12/2026"), Some("2026-12-25".into()));
}

#[test]
fn fechas_dd_mm_yy_asumen_siglo_xxi() {
    assert_eq!(normalizar_fecha("5/3/26"), Some("2026-03-05".into()));
    assert_eq!(normalizar_fecha("05/03/26"), Some("2026-03-05".into()));
}

#[test]
fn fechas_iso_pasan_tal_cual() {
    assert_eq!(normalizar_fecha("2026-07-15"), Some("2026-07-15".into()));
}

#[test]
fn fechas_fuera_de_rango_se_rechazan() {
    assert_eq!(normalizar_fecha("32/01/2026"), None);
    assert_eq!(normalizar_fecha("13/13/2026"), None);
    assert_eq!(normalizar_fecha("2026-13-01"), None);
    assert_eq!(normalizar_fecha("no-es-fecha"), None);
}
