//! Tests REQ-09-03 de plan_deuda: proyección mes a mes con interés
//! compuesto, métricas de intereses ahorrados y motor puro sin repo.

use super::deuda_tests::{liability, repo_ajustado};
use crate::application::plan_deuda::{calcular_plan_deuda, plan_deuda};
use crate::domain::currency::Currency;
use crate::domain::snapshot::{DebtStrategy, FinanceSnapshot, StrategySettings};

#[test]
fn proyeccion_sin_extra_devuelve_meses_e_intereses_totales() {
    // Deuda simple: 1000€ al 12% anual, pago mínimo 50€/mes.
    let repo = repo_ajustado(vec![liability("Préstamo", 1000.0, 12.0)], DebtStrategy::Avalanche, 0.0);
    let plan = plan_deuda(&repo).expect("plan válido");

    assert!(plan.proyeccion.meses_hasta_libre > 0);
    assert!(plan.proyeccion.intereses_totales > 0.0);
    assert!(plan.proyeccion.total_pagado > 1000.0);
}

#[test]
fn proyeccion_con_extra_reduce_meses_e_intereses() {
    let deudas = vec![liability("Préstamo", 1000.0, 12.0)];
    let sin_extra = repo_ajustado(deudas.clone(), DebtStrategy::Avalanche, 0.0);
    let con_extra = repo_ajustado(deudas, DebtStrategy::Avalanche, 100.0);
    let base = plan_deuda(&sin_extra).expect("plan sin extra");
    let extra = plan_deuda(&con_extra).expect("plan con extra");

    assert!(extra.proyeccion.meses_hasta_libre < base.proyeccion.meses_hasta_libre);
    assert!(extra.proyeccion.intereses_totales < base.proyeccion.intereses_totales);
}

#[test]
fn intereses_ahorrados_es_diferencia_entre_planes() {
    let deudas = vec![liability("Préstamo", 1000.0, 12.0)];
    let sin_extra = repo_ajustado(deudas.clone(), DebtStrategy::Avalanche, 0.0);
    let con_extra = repo_ajustado(deudas, DebtStrategy::Avalanche, 100.0);
    let base = plan_deuda(&sin_extra).expect("plan sin extra");
    let extra = plan_deuda(&con_extra).expect("plan con extra");

    let ahorrados = base.proyeccion.intereses_totales - extra.proyeccion.intereses_totales;
    assert!((extra.proyeccion.intereses_ahorrados - ahorrados).abs() < 0.01);
}

#[test]
fn multiples_deudas_proyeccion_libera_todas() {
    let repo = repo_ajustado(
        vec![liability("Tarjeta", 2000.0, 20.0), liability("Préstamo", 5000.0, 8.0)],
        DebtStrategy::Avalanche,
        200.0,
    );
    let plan = plan_deuda(&repo).expect("plan válido");

    assert!(plan.proyeccion.meses_hasta_libre > 0);
    // La proyección llega a saldo ~0 para todas las deudas.
    let ultimo_mes = plan.proyeccion.filas.last().expect("al menos una fila");
    assert!(ultimo_mes.saldo_total_restante.abs() < 1.0);
}

#[test]
fn estrategia_elegida_cambia_deuda_objetivo() {
    let deudas =
        vec![liability("Alta Tasa", 5000.0, 20.0), liability("Pequeña", 1000.0, 5.0)];
    let avalancha = repo_ajustado(deudas.clone(), DebtStrategy::Avalanche, 0.0);
    let bola = repo_ajustado(deudas, DebtStrategy::Snowball, 0.0);

    let plan_avalancha = plan_deuda(&avalancha).expect("plan avalancha");
    assert_eq!(
        plan_avalancha.deuda_objetivo.as_ref().map(|d| d.nombre.as_str()),
        Some("Alta Tasa")
    );

    let plan_bola = plan_deuda(&bola).expect("plan bola");
    assert_eq!(
        plan_bola.deuda_objetivo.as_ref().map(|d| d.nombre.as_str()),
        Some("Pequeña")
    );
}

#[test]
fn calcular_plan_deuda_puro_sin_repo() {
    // Test directo del motor puro con snapshot construido a mano.
    let mut snapshot = FinanceSnapshot::new();
    snapshot.liabilities =
        vec![liability("Tarjeta", 1000.0, 18.0), liability("Préstamo", 5000.0, 5.5)];
    snapshot.strategy = StrategySettings {
        debt_strategy: DebtStrategy::Avalanche,
        extra_monthly_payment: 100.0,
        currency: Currency::Mxn,
    };
    let plan = calcular_plan_deuda(&snapshot);

    assert_eq!(plan.orden_avalancha.len(), 2);
    assert_eq!(plan.orden_bola_nieve.len(), 2);
    assert!(plan.proyeccion.meses_hasta_libre > 0);
    assert!(plan.deuda_objetivo.is_some());
}
