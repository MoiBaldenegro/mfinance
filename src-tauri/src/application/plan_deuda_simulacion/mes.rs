//! Simulación de un mes del plan: interés compuesto mensual y un
//! presupuesto constante (suma de los mínimos iniciales + extra). Tras los
//! mínimos, lo que sobra —incluido el mínimo liberado por deudas ya
//! liquidadas (rollover)— cae en cascada según el orden de la estrategia.

use crate::application::plan_deuda_simulacion::tipos::DeudaPlan;

/// Deuda mutable para la simulación.
#[derive(Debug, Clone)]
pub(crate) struct DeudaMut {
    pub(crate) saldo: f64,
    tasa_interes_anual: f64,
    pago_minimo: f64,
}

impl DeudaMut {
    pub(crate) fn desde_deuda_plan(plan: &DeudaPlan) -> Self {
        Self {
            saldo: plan.saldo_pendiente,
            tasa_interes_anual: plan.tasa_interes_anual,
            pago_minimo: plan.pago_minimo_mensual,
        }
    }

    fn interes_mes(&self) -> f64 {
        self.saldo * (self.tasa_interes_anual / 100.0 / 12.0)
    }
}

/// Simula un mes de pagos sobre deudas ordenadas por la estrategia.
/// Devuelve (pago_total, intereses_mes, todas_liquidadas).
pub(crate) fn simular_mes(deudas: &mut [DeudaMut], extra_mensual: f64) -> (f64, f64, bool) {
    let presupuesto: f64 = deudas.iter().map(|d| d.pago_minimo).sum::<f64>() + extra_mensual.max(0.0);
    let mut intereses_totales = 0.0;
    for deuda in deudas.iter_mut().filter(|d| d.saldo > 0.0) {
        let interes = deuda.interes_mes();
        deuda.saldo += interes;
        intereses_totales += interes;
    }

    let mut disponible = presupuesto;
    // Mínimos de cada deuda viva.
    for deuda in deudas.iter_mut() {
        let pago = deuda.pago_minimo.min(deuda.saldo).min(disponible);
        deuda.saldo -= pago;
        disponible -= pago;
    }
    // Sobrante (extra + mínimos liberados) en cascada por orden de ataque.
    for deuda in deudas.iter_mut() {
        if disponible <= 0.0 {
            break;
        }
        let pago = disponible.min(deuda.saldo);
        deuda.saldo -= pago;
        disponible -= pago;
    }
    for deuda in deudas.iter_mut() {
        if deuda.saldo < 0.01 {
            deuda.saldo = 0.0;
        }
    }

    let pago_total = presupuesto - disponible;
    let todas_cero = deudas.iter().all(|d| d.saldo == 0.0);
    (pago_total, intereses_totales, todas_cero)
}
