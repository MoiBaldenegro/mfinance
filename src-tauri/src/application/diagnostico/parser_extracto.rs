//! REQ-12-20 + REQ-12-16: bucle de heurísticas de líneas del extracto
//! (fila nueva vs continuación vs ruido) y golden rule informativa.
//! Sin regex ni dependencias: escáneres deterministas cubiertos por tests.

use crate::domain::comprobante_pdf::{Coherencia, MovimientoDetectado};

use super::parser_coherencia::clasificar;
use super::parser_fecha::normalizar_fecha;
use super::parser_lineas::{
    colapsar, es_ruido, importe_de_linea, prefijo_fecha,
    ultimo_importe_con_posicion,
};

/// Salida del parseo de un extracto completo (todas sus páginas).
#[derive(Debug, Clone, PartialEq)]
pub struct ParseoExtracto {
    pub movimientos: Vec<MovimientoDetectado>,
    pub coherencia: Coherencia,
}

/// Parsea las páginas de texto de un extracto en movimientos.
/// Fila nueva = línea que arranca con fecha válida y contiene un importe;
/// línea sin fecha ni importe = continuación del concepto previo.
pub fn parsear_extracto(paginas: &[String]) -> ParseoExtracto {
    let mut movimientos: Vec<MovimientoDetectado> = Vec::new();
    let mut saldos = Saldos::default();
    for pagina in paginas {
        for linea in pagina.lines() {
            let linea = linea.trim();
            if linea.is_empty() || procesar_saldo(linea, &mut saldos) {
                continue;
            }
            if es_ruido(&linea.to_lowercase()) {
                continue;
            }
            if let Some(fin) = prefijo_fecha(linea) {
                crear_movimiento(linea, fin, &mut movimientos);
            } else if ultimo_importe_con_posicion(linea).is_none() {
                concatenar_continuacion(&mut movimientos, linea);
            }
        }
    }
    ParseoExtracto {
        coherencia: clasificar(saldos.inicial, saldos.final_, &movimientos),
        movimientos,
    }
}

#[derive(Default)]
struct Saldos {
    inicial: Option<f64>,
    final_: Option<f64>,
}

/// Captura los saldos impresos para la golden rule; devuelve true si la
/// línea era de saldo y por tanto no es una fila del extracto.
fn procesar_saldo(linea: &str, saldos: &mut Saldos) -> bool {
    let lower = linea.to_lowercase();
    if lower.contains("saldo inicial") {
        saldos.inicial = importe_de_linea(linea);
        return true;
    }
    if lower.contains("saldo final") {
        saldos.final_ = importe_de_linea(linea);
        return true;
    }
    false
}

fn crear_movimiento(
    linea: &str,
    fin_fecha: usize,
    movimientos: &mut Vec<MovimientoDetectado>,
) {
    let resto = &linea[fin_fecha..];
    let Some((centimos, posicion)) = ultimo_importe_con_posicion(resto) else {
        return; // línea con fecha sin importe: nunca fila fantasma.
    };
    let comercio = colapsar(&resto[..posicion]);
    let fecha = normalizar_fecha(linea[..fin_fecha].trim()).unwrap_or_default();
    movimientos.push(MovimientoDetectado::nuevo(
        &fecha,
        &comercio,
        centimos as f64 / 100.0,
    ));
}

fn concatenar_continuacion(
    movimientos: &mut [MovimientoDetectado],
    linea: &str,
) {
    if let Some(previo) = movimientos.last_mut() {
        previo.comercio.push(' ');
        previo.comercio.push_str(colapsar(linea).as_str());
        previo.comercio = colapsar(&previo.comercio);
    }
}
