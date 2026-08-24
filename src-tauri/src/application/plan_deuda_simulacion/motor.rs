//! Proyección del plan mes a mes: primitiva `proyectar_orden` compartida
//! por el plan de deuda (F9) y el simulador de créditos (REQ-15-03).

use crate::application::plan_deuda_simulacion::mes::{simular_mes, DeudaMut};
use crate::application::plan_deuda_simulacion::tipos::{
    DeudaPlan, FilaProyeccionDeuda, ProyeccionDeuda,
};

/// Calcula la proyección mes a mes para un orden dado de deudas con el
/// extra mensual indicado. Primitiva pública reutilizable (REQ-15-03).
pub fn proyectar_orden(deudas_ordenadas: &[DeudaPlan], extra_mensual: f64) -> ProyeccionDeuda {
    if deudas_ordenadas.is_empty() {
        return ProyeccionDeuda {
            filas: vec![],
            meses_hasta_libre: 0,
            intereses_totales: 0.0,
            total_pagado: 0.0,
            intereses_ahorrados: 0.0,
        };
    }

    let mut deudas_mut: Vec<DeudaMut> =
        deudas_ordenadas.iter().map(DeudaMut::desde_deuda_plan).collect();
    let mut filas = Vec::new();
    let mut mes = 0u32;
    let mut intereses_acumulados = 0.0;
    let mut total_pagado_acumulado = 0.0;

    // Límite de seguridad: máx 600 meses (50 años)
    while mes < 600 {
        mes += 1;
        if deudas_mut.iter().map(|d| d.saldo).sum::<f64>() < 0.01 {
            break;
        }
        let (pago_total, intereses_mes, todas_cero) = simular_mes(&mut deudas_mut, extra_mensual);
        intereses_acumulados += intereses_mes;
        total_pagado_acumulado += pago_total;

        filas.push(FilaProyeccionDeuda {
            mes,
            saldo_total_restante: deudas_mut.iter().map(|d| d.saldo).sum::<f64>().max(0.0),
            pago_total_mes: pago_total,
            intereses_mes,
            principal_mes: pago_total - intereses_mes,
        });

        if todas_cero {
            break;
        }
    }

    ProyeccionDeuda {
        filas,
        meses_hasta_libre: mes,
        intereses_totales: intereses_acumulados,
        total_pagado: total_pagado_acumulado,
        intereses_ahorrados: 0.0, // Se calcula fuera comparando dos planes
    }
}
