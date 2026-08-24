//! Simulación de un mes del plan: interés compuesto mensual, pagos
//! mínimos por deuda y extra dedicado a la primera deuda con saldo
//! (la objetivo según el orden elegido).

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

/// Simula un mes de pagos sobre una lista de deudas mutables.
/// Devuelve (pago_total, intereses_mes, todas_liquidadas).
pub(crate) fn simular_mes(deudas: &mut [DeudaMut], extra_mensual: f64) -> (f64, f64, bool) {
    let mut pago_total = 0.0;
    let mut intereses_totales = 0.0;

    // Primero calcular intereses de todas las deudas
    for deuda in deudas.iter_mut() {
        let interes = deuda.interes_mes();
        deuda.saldo += interes;
        intereses_totales += interes;
    }

    // Luego aplicar pagos mínimos
    for deuda in deudas.iter_mut() {
        let pago = deuda.pago_minimo.min(deuda.saldo);
        deuda.saldo -= pago;
        pago_total += pago;
    }

    // Aplicar pago extra a la primera deuda con saldo > 0 (la objetivo)
    if extra_mensual > 0.0 {
        for deuda in deudas.iter_mut() {
            if deuda.saldo > 0.01 {
                let pago_extra = extra_mensual.min(deuda.saldo);
                deuda.saldo -= pago_extra;
                pago_total += pago_extra;
                break;
            }
        }
    }

    let todas_cero = deudas.iter().all(|d| d.saldo < 0.01);
    (pago_total, intereses_totales, todas_cero)
}
