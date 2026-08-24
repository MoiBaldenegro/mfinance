//! Tests para completar_onboarding (REQ-23-08).

use crate::application::perfiles_onboarding::completar::completar_onboarding;
use crate::application::perfiles_onboarding::actualizar::actualizar_onboarding;
use crate::application::tests::memory_perfil_repository::MemoryPerfilRepository;
use crate::domain::onboarding::{OnboardingData, OnboardingStatus, Paso1Data, Paso3Data, Paso4Data, UmbralesIndicadores};
use crate::domain::currency::Currency;

fn repo_con_perfil() -> (MemoryPerfilRepository, String) {
    let mut repo = MemoryPerfilRepository::new();
    let perfil = repo.crear("Test").unwrap();
    (repo, perfil.id)
}

#[test]
fn completar_onboarding_consolida_y_marca_completed() {
    let (mut repo, id) = repo_con_perfil();

    let paso1 = Paso1Data {
        nombre_completo: "Juan".into(),
        moneda: Currency::Mxn,
        fuentes_ingreso_activas: vec!["salario".into(), "freelance".into()],
        categorias_gasto_usadas: vec!["vivienda".into(), "alimentacion".into()],
    };
    actualizar_onboarding(&mut repo, &id, OnboardingData { paso1: Some(paso1), ..Default::default() }).unwrap();

    let paso3 = Paso3Data {
        estrategia_deuda: Some("bola_de_nieve".into()),
        pago_extra_mensual: Some(150.0),
        supuestos_proyeccion: vec![],
    };
    actualizar_onboarding(&mut repo, &id, OnboardingData { paso3: Some(paso3), ..Default::default() }).unwrap();

    let paso4 = Paso4Data {
        umbrales: UmbralesIndicadores {
            endeudamiento_verde: Some(10.0),
            endeudamiento_rojo: Some(25.0),
            ..Default::default()
        },
    };
    actualizar_onboarding(&mut repo, &id, OnboardingData { paso4: Some(paso4), ..Default::default() }).unwrap();

    let perfil = completar_onboarding(&mut repo, &id).unwrap();

    assert_eq!(perfil.onboarding_status, OnboardingStatus::Completed);
    assert_eq!(perfil.financial_profile.fuentes_ingreso_activas, vec!["salario", "freelance"]);
    assert_eq!(perfil.financial_profile.categorias_gasto_usadas, vec!["vivienda", "alimentacion"]);
    assert_eq!(perfil.financial_profile.estrategia_deuda_preferida, Some("bola_de_nieve".into()));
    assert_eq!(perfil.financial_profile.pago_extra_mensual, Some(150.0));
    assert_eq!(perfil.financial_profile.umbrales_indicadores.endeudamiento_verde, Some(10.0));
}

#[test]
fn operaciones_con_perfil_inexistente_fallan_completar() {
    let mut repo = MemoryPerfilRepository::new();

    let err = completar_onboarding(&mut repo, "inexistente").unwrap_err();
    assert_eq!(err.codigo(), "PerfilInexistenteError");
}