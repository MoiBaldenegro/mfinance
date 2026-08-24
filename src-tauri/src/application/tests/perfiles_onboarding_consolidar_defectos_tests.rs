//! REQ-27-06: casos de consolidación con datos ausentes o inválidos.
//! Complementa `perfiles_onboarding_consolidar_tests` (flujo completo).

use crate::application::perfiles_onboarding::actualizar_onboarding;
use crate::application::perfiles_onboarding::completar_onboarding_con_snapshot;
use crate::application::tests::memory_perfil_repository::MemoryPerfilRepository;
use crate::application::tests::memory_repository::MemoryRepository;
use crate::domain::currency::Currency;
use crate::domain::onboarding::{OnboardingData, OnboardingStatus, Paso1Data, Paso3Data};
use crate::domain::snapshot::{DebtStrategy, FinanceSnapshot, StrategySettings};

fn paso1() -> Paso1Data {
    Paso1Data {
        nombre_completo: "Beto".into(),
        moneda: Currency::Usd,
        fuentes_ingreso_activas: vec!["salario".into()],
        categorias_gasto_usadas: vec!["vivienda".into()],
    }
}

#[test]
fn finalizar_sin_pasos_opcionales_deja_defectos_y_completa() {
    let mut repo = MemoryPerfilRepository::new();
    let id = repo.crear("Beto").unwrap().id;
    actualizar_onboarding(&mut repo, &id, OnboardingData { paso1: Some(paso1()), ..Default::default() }).unwrap();

    let mut snapshots = MemoryRepository { stored: Some(FinanceSnapshot::new()), ..Default::default() };
    let perfil = completar_onboarding_con_snapshot(&mut repo, &mut snapshots, &id).unwrap();

    assert_eq!(perfil.onboarding_status, OnboardingStatus::Completed);
    let guardado = snapshots.stored.clone().unwrap();
    // Sin paso 3 la estrategia del snapshot no cambia (defecto Avalanche)
    // pero la moneda del paso 1 sí se aplica siempre.
    assert_eq!(guardado.strategy.debt_strategy, DebtStrategy::Avalanche);
    assert_eq!(guardado.strategy.extra_monthly_payment, 0.0);
    assert_eq!(guardado.strategy.currency, Currency::Usd);
}

#[test]
fn estrategia_desconocida_no_rompe_la_consolidacion() {
    let mut repo = MemoryPerfilRepository::new();
    let id = repo.crear("Cleo").unwrap().id;
    let p3 = Paso3Data {
        estrategia_deuda: Some("estrategia_rara".into()),
        pago_extra_mensual: None,
        supuestos_proyeccion: vec![],
    };
    actualizar_onboarding(&mut repo, &id, OnboardingData { paso1: Some(paso1()), paso3: Some(p3), ..Default::default() }).unwrap();

    let mut snapshots = MemoryRepository { stored: Some(FinanceSnapshot::new()), ..Default::default() };
    let perfil = completar_onboarding_con_snapshot(&mut repo, &mut snapshots, &id).unwrap();
    assert_eq!(perfil.onboarding_status, OnboardingStatus::Completed);
    let guardado = snapshots.stored.clone().unwrap();
    assert_eq!(guardado.strategy.debt_strategy, DebtStrategy::Avalanche);
}

#[test]
fn strategy_settings_default_sigue_siendo_mxn_avalancha() {
    let defecto = StrategySettings::default();
    assert_eq!(defecto.currency, Currency::Mxn);
}
