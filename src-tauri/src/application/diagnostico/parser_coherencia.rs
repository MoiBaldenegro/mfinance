//! Golden rule informativa (REQ-12-16/17): contrasta saldo inicial +
//! abonos − cargos contra el saldo impreso. Nunca bloquea la revisión ni
//! la confirmación: solo clasifica el archivo para orientar al usuario.

use crate::domain::comprobante_pdf::{Coherencia, MovimientoDetectado};

/// Tolerancia: medio céntimo sobre el saldo impreso.
const TOLERANCIA_SALDO: f64 = 0.005;

/// Clasifica la coherencia de un archivo analizado.
pub(super) fn clasificar(
    saldo_inicial: Option<f64>,
    saldo_final: Option<f64>,
    movimientos: &[MovimientoDetectado],
) -> Coherencia {
    let (inicial, impreso) = match (saldo_inicial, saldo_final) {
        (Some(i), Some(f)) => (i, f),
        _ => return Coherencia::NoVerificable,
    };
    let abonos: f64 =
        movimientos.iter().map(|m| m.importe).filter(|v| *v > 0.0).sum();
    let cargos: f64 = movimientos
        .iter()
        .map(|m| m.importe)
        .filter(|v| *v < 0.0)
        .sum::<f64>()
        .abs();
    if (inicial + abonos - cargos - impreso).abs() <= TOLERANCIA_SALDO {
        Coherencia::Verificada
    } else {
        Coherencia::Discrepancia
    }
}
