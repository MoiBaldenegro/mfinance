//! Tests REQ-15-02 del simulador: pagos extra mensuales y extraordinarios
//! puntuales reducen plazo e intereses del crédito simulado.

use crate::application::simulador_creditos::comparador::simular_comparada;
use crate::application::simulador_creditos::types::{
    CreditoSimulado, ExtrasOptimizacion, PeticionSimulacion,
};

fn peticion(extra_mensual: f64, extraordinarios: Vec<(u32, f64)>) -> PeticionSimulacion {
    PeticionSimulacion {
        credito: CreditoSimulado {
            nombre: "Crédito hipotético".to_string(),
            importe: 10_000.0,
            plazo_meses: 12,
            tasa_interes_anual: 12.0,
        },
        extras: ExtrasOptimizacion {
            extra_mensual,
            extraordinarios: extraordinarios
                .into_iter()
                .map(|(mes, importe)| {
                    crate::application::simulador_creditos::types::ExtraordinarioPuntual {
                        mes,
                        importe,
                    }
                })
                .collect(),
        },
    }
}

/// Extra mensual de 200 € sobre el caso conocido: 12 → 10 meses y
/// 661,85 € → 543,11 € de intereses (ahorro ≈ 118,75 €).
#[test]
fn extra_mensual_reduce_plazo_e_intereses() {
    let sim = simular_comparada(&peticion(200.0, vec![])).expect("simulación válida");
    assert_eq!(sim.base.meses, 12);
    assert_eq!(sim.optimizado.meses, 10);
    assert!(
        (sim.optimizado.intereses_totales - 543.11).abs() <= 0.20,
        "intereses optimizado inesperados: {}",
        sim.optimizado.intereses_totales
    );
    assert_eq!(sim.meses_ahorrados, 2);
    assert!(
        (sim.intereses_ahorrados - 118.75).abs() <= 0.20,
        "intereses ahorrados inesperados: {}",
        sim.intereses_ahorrados
    );
}

/// Pago extraordinario puntual de 2.000 € al final del mes 3: también
/// acorta a 10 meses con 491,28 € de intereses (llega antes que el extra
/// repartido y por eso ahorra más que el escenario de 200 €/mes).
#[test]
fn extraordinario_puntual_reduce_plazo_e_intereses() {
    let sim = simular_comparada(&peticion(0.0, vec![(3, 2_000.0)])).expect("simulación válida");
    assert_eq!(sim.base.meses, 12);
    assert_eq!(sim.optimizado.meses, 10);
    assert!(
        (sim.optimizado.intereses_totales - 491.28).abs() <= 0.20,
        "intereses optimizado inesperados: {}",
        sim.optimizado.intereses_totales
    );
    assert_eq!(sim.meses_ahorrados, 2);
    assert!(
        (sim.intereses_ahorrados - 170.57).abs() <= 0.20,
        "intereses ahorrados inesperados: {}",
        sim.intereses_ahorrados
    );
}

#[test]
fn sin_extras_el_optimizado_coincide_con_el_base() {
    let sim = simular_comparada(&peticion(0.0, vec![])).expect("simulación válida");
    assert_eq!(sim.meses_ahorrados, 0);
    assert!(sim.intereses_ahorrados.abs() < 0.005);
    assert_eq!(sim.base.meses, sim.optimizado.meses);
}

#[test]
fn el_extraordinario_adelantado_ahorra_mas_que_el_extra_repartido() {
    let con_mensual = simular_comparada(&peticion(200.0, vec![])).expect("mensual");
    let con_puntual = simular_comparada(&peticion(0.0, vec![(3, 2_400.0)])).expect("puntual");
    // Mismo dinero total adelantado (200 € × ~10 meses vs 2.400 € en mes 3):
    // el puntual llega antes y reduce más los intereses.
    assert!(con_puntual.optimizado.intereses_totales <= con_mensual.optimizado.intereses_totales);
}
