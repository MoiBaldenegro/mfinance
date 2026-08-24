//! Fachada del plan de deuda: órdenes por estrategia, proyección según la
//! estrategia y extra del snapshot, intereses ahorrados y deuda objetivo.

use crate::application::plan_deuda_simulacion::motor::proyectar_orden;
use crate::application::plan_deuda_simulacion::orden::{orden_avalancha, orden_bola_nieve};
use crate::application::plan_deuda_simulacion::tipos::PlanDeuda;
use crate::domain::snapshot::{DebtStrategy, FinanceSnapshot};

/// Motor puro del plan de deuda: calcula todo sobre un snapshot cualquiera.
pub fn calcular_plan_deuda(snapshot: &FinanceSnapshot) -> PlanDeuda {
    let orden_avalancha = orden_avalancha(&snapshot.liabilities);
    let orden_bola_nieve = orden_bola_nieve(&snapshot.liabilities);

    let extra = snapshot.strategy.extra_monthly_payment.max(0.0);
    let estrategia = snapshot.strategy.debt_strategy;

    // Proyección según la estrategia elegida
    let deudas_para_proyeccion = match estrategia {
        DebtStrategy::Avalanche => &orden_avalancha,
        DebtStrategy::Snowball => &orden_bola_nieve,
    };

    let mut proyeccion = proyectar_orden(deudas_para_proyeccion, extra);

    // Calcular intereses ahorrados: comparar con plan sin extra
    if extra > 0.0 {
        let proyeccion_sin_extra = proyectar_orden(deudas_para_proyeccion, 0.0);
        proyeccion.intereses_ahorrados =
            proyeccion_sin_extra.intereses_totales - proyeccion.intereses_totales;
    }

    // Deuda objetivo según estrategia
    let deuda_objetivo = deudas_para_proyeccion.first().cloned();

    PlanDeuda {
        orden_avalancha,
        orden_bola_nieve,
        proyeccion,
        deuda_objetivo,
    }
}
