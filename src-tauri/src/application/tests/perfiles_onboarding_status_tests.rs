//! Tests para obtener_onboarding_status (REQ-23-09).

use crate::application::perfiles_onboarding::status::obtener_onboarding_status;
use crate::application::perfiles_onboarding::actualizar::actualizar_onboarding;
use crate::application::perfiles_onboarding::completar::completar_onboarding;
use crate::application::tests::memory_perfil_repository::MemoryPerfilRepository;
use crate::domain::onboarding::{OnboardingData, OnboardingStatus, Paso1Data};
use crate::domain::currency::Currency;

fn repo_con_perfil() -> (MemoryPerfilRepository, String) {
    let mut repo = MemoryPerfilRepository::new();
    let perfil = repo.crear("Test").unwrap();
    (repo, perfil.id)
}

#[test]
fn obtener_onboarding_status_devuelve_estado_actual() {
    let (mut repo, id) = repo_con_perfil();

    assert_eq!(obtener_onboarding_status(&mut repo, &id).unwrap(), OnboardingStatus::NotStarted);

    let paso1 = Paso1Data {
        nombre_completo: "Juan".into(),
        moneda: Currency::Mxn,
        fuentes_ingreso_activas: vec!["salario".into()],
        categorias_gasto_usadas: vec!["vivienda".into()],
    };
    actualizar_onboarding(&mut repo, &id, OnboardingData { paso1: Some(paso1), ..Default::default() }).unwrap();

    assert!(matches!(obtener_onboarding_status(&mut repo, &id).unwrap(), OnboardingStatus::InProgress { current_step: 1 }));

    completar_onboarding(&mut repo, &id).unwrap();
    assert_eq!(obtener_onboarding_status(&mut repo, &id).unwrap(), OnboardingStatus::Completed);
}

#[test]
fn operaciones_con_perfil_inexistente_fallan_status() {
    let mut repo = MemoryPerfilRepository::new();

    let err = obtener_onboarding_status(&mut repo, "inexistente").unwrap_err();
    assert_eq!(err.codigo(), "PerfilInexistenteError");
}