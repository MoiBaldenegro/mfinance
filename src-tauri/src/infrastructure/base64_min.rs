//! Decodificador base64 mínimo (design.md F12): stdlib puro, sin crates.
//! El frontend envía los bytes de los PDFs como cadena base64 por IPC;
//! decodificar es transporte, no parseo.

const ALFABETO: &[u8; 64] =
    b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/// Decodifica una cadena base64 (ignora espacios y saltos de línea).
/// Devuelve el motivo del fallo si la cadena es inválida.
pub fn decodificar(texto: &str) -> Result<Vec<u8>, String> {
    let limpio: Vec<u8> = texto
        .bytes()
        .filter(|b| !b.is_ascii_whitespace())
        .collect();
    if limpio.len() % 4 != 0 {
        return Err(format!(
            "longitud base64 inválida ({}): debe ser múltiplo de 4",
            limpio.len()
        ));
    }
    let datos: &[u8] = &limpio[..limpio.iter().position(|b| *b == b'=').unwrap_or(limpio.len())];
    let relleno = limpio.len() - datos.len();
    if relleno > 2 || limpio[datos.len()..].iter().any(|b| *b != b'=') {
        return Err("relleno '=' mal colocado".to_string());
    }
    let mut salida = Vec::with_capacity(datos.len() * 3 / 4 + 3);
    let mut acumulado: u32 = 0;
    let mut bits: u32 = 0;
    for byte in datos {
        acumulado = (acumulado << 6) | valor(*byte)? as u32;
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            salida.push(((acumulado >> bits) & 0xFF) as u8);
        }
    }
    Ok(salida)
}

fn valor(byte: u8) -> Result<u8, String> {
    ALFABETO
        .iter()
        .position(|c| *c == byte)
        .map(|p| p as u8)
        .ok_or_else(|| format!("carácter base64 inválido: {:?}", byte as char))
}
