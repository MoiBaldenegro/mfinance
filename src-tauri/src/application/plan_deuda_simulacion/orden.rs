//! Ordenaciones del plan: avalancha (tasa descendente) y bola de nieve
//! (saldo ascendente). `ordenar_por_tasa` y `ordenar_por_saldo` operan
//! sobre listas de `DeudaPlan` ya construidas para que otros casos de uso
//! (simulador de créditos) reutilicen las mismas reglas de orden.

use crate::application::plan_deuda_simulacion::tipos::DeudaPlan;
use crate::domain::liability::Liability;

/// Ordena deudas por avalancha: tasa de interés descendente.
pub fn ordenar_por_tasa(mut deudas: Vec<DeudaPlan>) -> Vec<DeudaPlan> {
    deudas.sort_by(|a, b| {
        b.tasa_interes_anual
            .partial_cmp(&a.tasa_interes_anual)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    deudas
}

/// Ordena deudas por bola de nieve: saldo pendiente ascendente.
pub fn ordenar_por_saldo(mut deudas: Vec<DeudaPlan>) -> Vec<DeudaPlan> {
    deudas.sort_by(|a, b| {
        a.saldo_pendiente
            .partial_cmp(&b.saldo_pendiente)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    deudas
}

/// Ordena los pasivos reales por avalancha: tasa de interés descendente.
pub fn orden_avalancha(liabilities: &[Liability]) -> Vec<DeudaPlan> {
    ordenar_por_tasa(liabilities.iter().map(DeudaPlan::desde_liability).collect())
}

/// Ordena los pasivos reales por bola de nieve: saldo pendiente ascendente.
pub fn orden_bola_nieve(liabilities: &[Liability]) -> Vec<DeudaPlan> {
    ordenar_por_saldo(liabilities.iter().map(DeudaPlan::desde_liability).collect())
}
