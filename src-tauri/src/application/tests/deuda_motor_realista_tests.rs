//! Motor de deuda realista: el pago mínimo cubre siempre el interés y el
//! pago liberado de una deuda liquidada pasa a la siguiente (rollover),
//! que es lo que distingue Avalancha de Bola de nieve.

use super::deuda_tests::{liability, repo_ajustado};
use crate::application::plan_deuda::plan_deuda;
use crate::application::plan_deuda_simulacion::DeudaPlan;
use crate::domain::snapshot::DebtStrategy;

#[test]
fn pago_minimo_cubre_interes_mensual_y_amortiza() {
    let tarjeta = liability("Tarjeta", 32_000.0, 42.0);
    let deuda = DeudaPlan::desde_liability(&tarjeta);
    let interes_mensual = 32_000.0 * 0.42 / 12.0;
    assert!(deuda.pago_minimo_mensual > interes_mensual, "mínimo {} <= interés {}", deuda.pago_minimo_mensual, interes_mensual);
}

#[test]
fn deuda_de_tasa_alta_se_liquida_en_un_plazo_finito() {
    let repo = repo_ajustado(vec![liability("Tarjeta", 32_000.0, 42.0)], DebtStrategy::Avalanche, 0.0);
    let plan = plan_deuda(&repo).expect("plan válido");
    assert!(plan.proyeccion.meses_hasta_libre < 600);
    let ultima = plan.proyeccion.filas.last().expect("filas");
    assert!(ultima.saldo_total_restante < 0.01);
}

#[test]
fn el_saldo_total_nunca_crece_mes_a_mes() {
    let deudas = vec![liability("Tarjeta", 32_000.0, 42.0), liability("Auto", 85_000.0, 14.5)];
    let plan = plan_deuda(&repo_ajustado(deudas, DebtStrategy::Snowball, 0.0)).expect("plan");
    for par in plan.proyeccion.filas.windows(2) {
        assert!(par[1].saldo_total_restante <= par[0].saldo_total_restante + 1e-6);
    }
}

#[test]
fn rollover_mantiene_el_presupuesto_mensual_hasta_el_final() {
    let deudas = vec![liability("Pequeña", 2_000.0, 10.0), liability("Grande", 20_000.0, 10.0)];
    let plan = plan_deuda(&repo_ajustado(deudas, DebtStrategy::Snowball, 0.0)).expect("plan");
    let filas = &plan.proyeccion.filas;
    let presupuesto = filas[0].pago_total_mes;
    // Todas las filas salvo la última pagan el presupuesto completo.
    for fila in &filas[..filas.len() - 1] {
        assert!((fila.pago_total_mes - presupuesto).abs() < 0.01, "mes {} pagó {}", fila.mes, fila.pago_total_mes);
    }
}

#[test]
fn avalancha_paga_menos_intereses_que_bola_de_nieve_con_extra() {
    let deudas = vec![liability("Cara pequeña", 5_000.0, 40.0), liability("Barata grande", 3_000.0, 5.0)];
    let avalancha = plan_deuda(&repo_ajustado(deudas.clone(), DebtStrategy::Avalanche, 100.0)).expect("plan");
    let bola = plan_deuda(&repo_ajustado(deudas, DebtStrategy::Snowball, 100.0)).expect("plan");
    assert!(avalancha.proyeccion.intereses_totales < bola.proyeccion.intereses_totales);
}
