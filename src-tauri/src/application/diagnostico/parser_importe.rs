//! REQ-12-18: importes españoles a céntimos exactos. Punto de millares
//! ANTES de coma decimal; trailing minus y paréntesis = negativo; NBSP
//! normalizado; guion/em-dash en columna = no aplica.

/// Convierte un importe español (`1.234,56 €`, `237,08-`, `(237,08)`…)
/// a céntimos enteros exactos; None si el token no es un importe.
pub fn importe_a_centimos(raw: &str) -> Option<i64> {
    let mut texto: String = raw
        .chars()
        .map(|c| match c {
            '\u{00a0}' | '\u{2009}' | '\u{202f}' => ' ',
            otro => otro,
        })
        .collect();
    texto.retain(|c| !c.is_whitespace() && c != '€');
    if texto.is_empty()
        || texto.chars().all(|c| c == '-' || c == '\u{2014}' || c == '\u{2013}')
    {
        return None;
    }
    let (negativo, cuerpo) = separar_signo(texto)?;
    let centimos = parsear_cifra(&cuerpo, negativo)?;
    Some(if negativo { -centimos } else { centimos })
}

/// Extrae el signo de paréntesis contable, trailing minus o signo inicial.
fn separar_signo(mut texto: String) -> Option<(bool, String)> {
    let mut negativo = false;
    if texto.starts_with('(') && texto.ends_with(')') && texto.len() > 2 {
        negativo = true;
        texto = texto[1..texto.len() - 1].to_string();
    } else if texto.ends_with('-') {
        negativo = true;
        texto.pop();
    } else if texto.starts_with('-') {
        negativo = true;
        texto.remove(0);
    }
    if texto.is_empty() {
        return None;
    }
    Some((negativo, texto))
}

fn parsear_cifra(texto: &str, negativo: bool) -> Option<i64> {
    // Un importe necesita evidencia monetaria: separadores o signo.
    if !(texto.contains(',') || texto.contains('.') || negativo) {
        return None;
    }
    let centimos = if texto.contains(',') {
        decimales(&texto.replace('.', ""))?
    } else if texto.contains('.') {
        grupos_millares(texto)? * 100
    } else {
        solo_digitos(texto)? * 100
    };
    Some(centimos)
}

/// Parte entera + 1-2 decimales tras la coma («45,30» → 4530).
fn decimales(cifra: &str) -> Option<i64> {
    let (entera, decimal) = cifra.split_once(',')?;
    if decimal.is_empty() || decimal.len() > 2 {
        return None;
    }
    Some(solo_digitos(entera)? * 100 + solo_digitos(decimal)?)
}

/// Grupos de millares: primero de 1-3 dígitos, resto exactamente de 3.
fn grupos_millares(texto: &str) -> Option<i64> {
    let grupos: Vec<&str> = texto.split('.').collect();
    if !(1..=3).contains(&grupos.first()?.len()) {
        return None;
    }
    if grupos.iter().skip(1).any(|g| g.len() != 3) {
        return None;
    }
    solo_digitos(&grupos.concat())
}

fn solo_digitos(texto: &str) -> Option<i64> {
    if texto.is_empty() || !texto.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    texto.parse().ok()
}
