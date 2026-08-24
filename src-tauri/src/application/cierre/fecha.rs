//! Fecha ISO del cierre sin crates externas: conversión días-época a
//! fecha civil (algoritmo de Hinnant), pura y testeable.

use std::time::{SystemTime, UNIX_EPOCH};

/// Convierte días desde 1970-01-01 a fecha ISO YYYY-MM-DD.
pub fn fecha_iso_desde_epoch(dias: u64) -> String {
    let z = dias as i64 + 719_468;
    let era = z / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { yoe + era * 400 + 1 } else { yoe + era * 400 };
    format!("{y:04}-{m:02}-{d:02}")
}

/// Fecha de hoy en formato ISO YYYY-MM-DD según el reloj del sistema.
pub fn fecha_iso_hoy() -> String {
    let dias = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() / 86_400)
        .unwrap_or(0);
    fecha_iso_desde_epoch(dias)
}
