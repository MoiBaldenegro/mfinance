//! REQ-12-19: normalización de fechas del extracto a YYYY-MM-DD.
//! Formatos admitidos: dd/mm/yyyy, dd/mm/yy e ISO YYYY-MM-DD.

/// Normaliza `dd/mm/yyyy`, `dd/mm/yy` o ISO `YYYY-MM-DD` a `YYYY-MM-DD`.
pub fn normalizar_fecha(token: &str) -> Option<String> {
    let t = token.trim();
    let partes: Vec<&str> = t.split('-').collect();
    if partes.len() == 3 {
        if partes[1].len() == 2 && partes[2].len() == 2 {
            return componer(partes[0], partes[1], partes[2]);
        }
        return None;
    }
    let partes: Vec<&str> = t.split('/').collect();
    if partes.len() == 3 {
        return match partes[2].len() {
            4 => componer(partes[2], partes[1], partes[0]),
            2 => componer(&format!("20{}", partes[2]), partes[1], partes[0]),
            _ => None,
        };
    }
    None
}

/// Compone y valida una fecha con año de 4 dígitos, mes 01..=12 y día
/// 01..=31, rellenando con ceros lo que haga falta.
fn componer(anio: &str, mes: &str, dia: &str) -> Option<String> {
    let digitos =
        |s: &str| !s.is_empty() && s.bytes().all(|b| b.is_ascii_digit());
    if anio.len() != 4 || !digitos(anio) || !digitos(mes) || !digitos(dia) {
        return None;
    }
    let m: u32 = mes.parse().ok()?;
    let d: u32 = dia.parse().ok()?;
    if !(1..=12).contains(&m) || !(1..=31).contains(&d) {
        return None;
    }
    Some(format!("{anio}-{m:02}-{d:02}"))
}
