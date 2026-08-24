//! Tests REQ-09-01/02 de plan_deuda: ordenación avalancha/bola de
//! nieve y caso vacío. La proyección vive en deuda_proyeccion_tests.rs.

use super::memory_repository::MemoryRepository;
use crate::application::plan_deuda::plan_deuda;
use crate::domain::currency::Currency;
use crate::domain::liability::Liability;
use crate::domain::snapshot::{DebtStrategy, FinanceSnapshot, StrategySettings};

pub(super) fn liability(nombre: &str, saldo: f64, tasa: f64) -> Liability {
    Liability::new(nombre.to_string(), saldo, tasa).expect("liability válido")
}

pub(super) fn repo_con_liabilities(liabilities: Vec<Liability>) -> MemoryRepository {
    let mut repo = MemoryRepository::default();
    let mut snapshot = FinanceSnapshot::new();
    snapshot.liabilities = liabilities;
    snapshot.strategy = StrategySettings {
        debt_strategy: DebtStrategy::Avalanche,
        extra_monthly_payment: 0.0,
        currency: Currency::Mxn,
    };
    repo.stored = Some(snapshot);
    repo
}

/// Repo sembrado con las deudas dadas y los ajustes de estrategia fijados.
pub(super) fn repo_ajustado(
    liabilities: Vec<Liability>,
    estrategia: DebtStrategy,
    extra: f64,
) -> MemoryRepository {
    let mut repo = repo_con_liabilities(liabilities);
    if let Some(snapshot) = &mut repo.stored {
        snapshot.strategy.debt_strategy = estrategia;
        snapshot.strategy.extra_monthly_payment = extra;
    }
    repo
}

#[test]
fn avalancha_ordena_por_tasa_descendente() {
    let liabilities = vec![
        liability("Tarjeta A", 1000.0, 18.0),
        liability("Préstamo B", 5000.0, 5.5),
        liability("Hipoteca C", 100000.0, 3.2),
    ];
    let plan = plan_deuda(&repo_con_liabilities(liabilities)).expect("plan válido");

    let nombres: Vec<&str> = plan.orden_avalancha.iter().map(|d| d.nombre.as_str()).collect();
    assert_eq!(nombres, vec!["Tarjeta A", "Préstamo B", "Hipoteca C"]);
}

#[test]
fn bola_nieve_ordena_por_saldo_ascendente() {
    let liabilities = vec![
        liability("Tarjeta A", 1000.0, 18.0),
        liability("Préstamo B", 5000.0, 5.5),
        liability("Hipoteca C", 100000.0, 3.2),
    ];
    let plan = plan_deuda(&repo_con_liabilities(liabilities)).expect("plan válido");

    let nombres: Vec<&str> = plan.orden_bola_nieve.iter().map(|d| d.nombre.as_str()).collect();
    assert_eq!(nombres, vec!["Tarjeta A", "Préstamo B", "Hipoteca C"]);
}

#[test]
fn avalancha_y_bola_nieve_difieren_cuando_tasa_y_saldo_no_correlacionan() {
    // Caso donde la deuda con mayor tasa no es la de menor saldo.
    let liabilities = vec![
        liability("Deuda Alta Tasa", 5000.0, 20.0), // mayor tasa, saldo medio
        liability("Deuda Pequeña", 1000.0, 5.0),    // menor saldo, tasa baja
        liability("Deuda Grande", 20000.0, 10.0),   // mayor saldo, tasa media
    ];
    let plan = plan_deuda(&repo_con_liabilities(liabilities)).expect("plan válido");

    let avalancha: Vec<&str> = plan.orden_avalancha.iter().map(|d| d.nombre.as_str()).collect();
    let bola: Vec<&str> = plan.orden_bola_nieve.iter().map(|d| d.nombre.as_str()).collect();

    assert_eq!(avalancha, vec!["Deuda Alta Tasa", "Deuda Grande", "Deuda Pequeña"]);
    assert_eq!(bola, vec!["Deuda Pequeña", "Deuda Alta Tasa", "Deuda Grande"]);
}

#[test]
fn sin_deudas_devuelve_plan_vacio() {
    let repo = repo_con_liabilities(vec![]);
    let plan = plan_deuda(&repo).expect("plan vacío");

    assert!(plan.orden_avalancha.is_empty());
    assert!(plan.orden_bola_nieve.is_empty());
    assert!(plan.proyeccion.filas.is_empty());
    assert_eq!(plan.proyeccion.meses_hasta_libre, 0);
    assert_eq!(plan.proyeccion.intereses_totales, 0.0);
    assert!(plan.deuda_objetivo.is_none());
}
