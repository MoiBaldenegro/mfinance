//! Parte 2 del parser: escáneres de líneas e importes sobre texto plano
//! (helpers puros de parser_extracto). Sin regex: escáner determinista.

/// Blacklist determinista de pies del banco (design.md F12).
pub(super) fn es_ruido(lower: &str) -> bool {
    lower.starts_with("estimado")
        || lower.starts_with("saldo")
        || lower.starts_with("total")
        || lower.starts_with("pagina")
        || lower.starts_with("página")
}

/// Colapsa espacios múltiples en uno solo.
pub(super) fn colapsar(texto: &str) -> String {
    texto.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// Tokens no vacíos con su posición inicial en bytes dentro del texto.
pub(super) fn tokens_con_posicion(texto: &str) -> Vec<(usize, &str)> {
    let bytes = texto.as_bytes();
    let mut salida = Vec::new();
    let mut inicio: Option<usize> = None;
    for (i, byte) in bytes.iter().enumerate() {
        if byte.is_ascii_whitespace() {
            if let Some(s) = inicio.take() {
                salida.push((s, &texto[s..i]));
            }
        } else if inicio.is_none() {
            inicio = Some(i);
        }
    }
    if let Some(s) = inicio {
        salida.push((s, &texto[s..]));
    }
    salida
}

/// Último token que se interpreta como importe: (céntimos, posición).
pub(super) fn ultimo_importe_con_posicion(texto: &str) -> Option<(i64, usize)> {
    tokens_con_posicion(texto)
        .into_iter()
        .rev()
        .find_map(|(posicion, token)| {
            super::parser_importe::importe_a_centimos(token)
                .map(|centimos| (centimos, posicion))
        })
}

/// Importe (euros) de una línea tipo «Saldo inicial 1.000,00».
pub(super) fn importe_de_linea(linea: &str) -> Option<f64> {
    ultimo_importe_con_posicion(linea).map(|(centimos, _)| centimos as f64 / 100.0)
}

/// Longitud del prefijo de fecha válido al inicio de la línea, si lo hay.
pub(super) fn prefijo_fecha(linea: &str) -> Option<usize> {
    let bytes = linea.as_bytes();
    let iso_ok = prefijo_iso(bytes)
        && super::parser_fecha::normalizar_fecha(&linea[..10]).is_some();
    if iso_ok {
        return Some(10);
    }
    prefijo_barra(linea)
}

fn prefijo_iso(bytes: &[u8]) -> bool {
    bytes.len() >= 10
        && bytes[..4].iter().all(|b| b.is_ascii_digit())
        && bytes[4] == b'-'
        && bytes[5..7].iter().all(|b| b.is_ascii_digit())
        && bytes[7] == b'-'
        && bytes[8..10].iter().all(|b| b.is_ascii_digit())
        && (bytes.len() == 10 || bytes[10].is_ascii_whitespace())
}

fn prefijo_barra(linea: &str) -> Option<usize> {
    let bytes = linea.as_bytes();
    let corte = bytes.len().min(6);
    let primera = bytes[..corte].iter().position(|b| *b == b'/')?;
    if !(1..=2).contains(&primera) { return None; }
    let resto = &bytes[primera + 1..];
    let relativa = resto.iter().position(|b| *b == b'/')?;
    if !(1..=2).contains(&relativa) { return None; }
    let segunda = primera + 1 + relativa;
    let tras_segunda = &bytes[segunda + 1..];
    let largo_anio = tras_segunda
        .iter()
        .position(|b| !b.is_ascii_digit())
        .unwrap_or(tras_segunda.len());
    if !(largo_anio == 2 || largo_anio == 4) { return None; }
    let fin = segunda + 1 + largo_anio;
    let borde = fin == bytes.len() || bytes[fin].is_ascii_whitespace();
    if fin <= bytes.len()
        && borde
        && super::parser_fecha::normalizar_fecha(&linea[..fin]).is_some()
    {
        return Some(fin);
    }
    None
}
