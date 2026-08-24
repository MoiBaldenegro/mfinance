//! REQ-21-01: reloj del dominio para `creado_en`. Formato ISO-8601 UTC
//! determinista a partir de segundos de época, con Rust stdlib (sin
//! crates de fechas) y testeable contra instantes conocidos.

use std::time::{SystemTime, UNIX_EPOCH};

/// Instante actual en formato ISO-8601 UTC (`AAAA-MM-DDTHH:MM:SSZ`).
pub fn ahora_iso() -> String {
    let segundos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    iso_de_epoch(segundos)
}

/// Convierte segundos de época Unix en ISO-8601 UTC. Algoritmo civil
/// (Hinnant): días → fecha gregoriana sin bucles ni tablas.
pub fn iso_de_epoch(segundos: u64) -> String {
    let dias = (segundos / 86_400) as i64;
    let resto = segundos % 86_400;
    let (anio, mes, dia) = civil_desde_dias(dias);
    format!(
        "{anio:04}-{mes:02}-{dia:02}T{:02}:{:02}:{:02}Z",
        resto / 3_600,
        (resto % 3_600) / 60,
        resto % 60
    )
}

/// Días desde la época → (año, mes, día) del calendario civil.
fn civil_desde_dias(z: i64) -> (i64, u32, u32) {
    let z = z + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u64;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let anio = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let dia = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let mes = (if mp < 10 { mp + 3 } else { mp - 9 }) as u32;
    (if mes <= 2 { anio + 1 } else { anio }, mes, dia)
}
