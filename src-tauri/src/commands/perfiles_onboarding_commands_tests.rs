//! Tests para los commands de onboarding de perfiles.

use crate::application::perfiles_onboarding;
use crate::application::tests::memory_perfil_repository::MemoryPerfilRepository;
use crate::domain::onboarding::{Paso1Data, OnboardingData};
use crate::domain::currency::Currency;

#[test]
fn actualizar_onboarding_command_delega_correctamente() {
    let mut repo = MemoryPerfilRepository::new();
    let perfil = repo.crear("Test").unwrap();
    let id = perfil.id.clone();

    let paso1 = Paso1Data {
        nombre_completo: "Juan".into(),
        moneda: Currency::Mxn,
        fuentes_ingreso_activas: vec!["salario".into()],
        categorias_gasto_usadas: vec!["vivienda".into()],
    };
    let datos = OnboardingData { paso1: Some(paso1), ..Default::default() };

    perfiles_onboarding::actualizar_onboarding(&mut repo, &id, datos).unwrap();

    let p = repo.obtener(&id).unwrap();
    assert_eq!(p.onboarding_data.paso1.as_ref().unwrap().nombre_completo, "Juan");
}

#[test]
fn completar_onboarding_command_consolida_y_marca() {
    let mut repo = MemoryPerfilRepository::new();
    let perfil = repo.crear("Test").unwrap();
    let id = perfil.id.clone();

    let paso1 = Paso1Data {
        nombre_completo: "Juan".into(),
        moneda: Currency::Mxn,
        fuentes_ingreso_activas: vec!["salario".into()],
        categorias_gasto_usadas: vec!["vivienda".into()],
    };
    perfiles_onboarding::actualizar_onboarding(&mut repo, &id, OnboardingData { paso1: Some(paso1), ..Default::default() }).unwrap();

    let perfil = perfiles_onboarding::completar_onboarding(&mut repo, &id).unwrap();
    assert_eq!(perfil.onboarding_status, crate::domain::onboarding::OnboardingStatus::Completed);
    assert_eq!(perfil.financial_profile.fuentes_ingreso_activas, vec!["salario"]);
}

#[test]
fn obtener_onboarding_status_command_devuelve_estado() {
    let mut repo = MemoryPerfilRepository::new();
    let perfil = repo.crear("Test").unwrap();
    let id = perfil.id.clone();

    let status = perfiles_onboarding::obtener_onboarding_status(&mut repo, &id).unwrap();
    assert_eq!(status, crate::domain::onboarding::OnboardingStatus::NotStarted);
}