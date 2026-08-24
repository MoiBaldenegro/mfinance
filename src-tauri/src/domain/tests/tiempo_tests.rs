//! Tests REQ-21-01 del reloj del dominio: formato ISO-8601 UTC
//! determinista a partir de segundos de época (sin crates externas).

use crate::domain::tiempo::{ahora_iso, iso_de_epoch};

#[test]
fn epoch_cero_es_la_epoca_unix() {
    assert_eq!(iso_de_epoch(0), "1970-01-01T00:00:00Z");
}

#[test]
fn instantes_conocidos_se_formatean_en_utc() {
    // Bisiesto: el 29 de febrero debe formatearse correctamente.
    assert_eq!(iso_de_epoch(951_782_400), "2000-02-29T00:00:00Z");
    assert_eq!(iso_de_epoch(1_000_000_000), "2001-09-09T01:46:40Z");
    assert_eq!(iso_de_epoch(2_000_000_000), "2033-05-18T03:33:20Z");
}

#[test]
fn el_reloj_actual_produce_formato_iso_valido() {
    let s = ahora_iso();
    assert_eq!(s.len(), 20, "AAAA-MM-DDTHH:MM:SSZ son 20 caracteres");
    assert!(s.ends_with('Z'));
    assert_eq!(s.as_bytes()[4], b'-');
    assert_eq!(s.as_bytes()[7], b'-');
    assert_eq!(s.as_bytes()[10], b'T');
    assert_eq!(s.as_bytes()[13], b':');
    assert_eq!(s.as_bytes()[16], b':');
}
