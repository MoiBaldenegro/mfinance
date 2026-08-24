//! Tests para actualizar_onboarding (REQ-23-07).

use crate::application::perfiles_onboarding::actualizar::actualizar_onboarding;
use crate::application::tests::memory_perfil_repository::MemoryPerfilRepository;
use crate::domain::onboarding::{OnboardingData, OnboardingStatus, Paso1Data, Paso2Data, Paso3Data, SupuestoProyeccion};
use crate::domain::currency::Currency;

fn repo_con_perfil() -> (MemoryPerfilRepository, String) {
    let mut repo = MemoryPerfilRepository::new();
    let perfil = repo.crear("Test").unwrap();
    (repo, perfil.id)
}

#[test]
fn actualizar_onboarding_fusiona_datos_parciales() {
    let (mut repo, id) = repo_con_perfil();

    let paso1 = Paso1Data {
        nombre_completo: "Juan".into(),
        moneda: Currency::Mxn,
        fuentes_ingreso_activas: vec!["salario".into()],
        categorias_gasto_usadas: vec!["vivienda".into()],
    };
    actualizar_onboarding(&mut repo, &id, OnboardingData { paso1: Some(paso1), ..Default::default() }).unwrap();

    let perfil = repo.obtener(&id).unwrap();
    assert_eq!(perfil.onboarding_data.paso1.as_ref().unwrap().nombre_completo, "Juan");
    assert!(matches!(perfil.onboarding_status, OnboardingStatus::InProgress { current_step: 1 }));
}

#[test]
fn actualizar_onboarding_paso2_y_paso3() {
    let (mut repo, id) = repo_con_perfil();

    // Paso 1 primero
    let paso1 = Paso1Data {
        nombre_completo: "Juan".into(),
        moneda: Currency::Mxn,
        fuentes_ingreso_activas: vec!["salario".into()],
        categorias_gasto_usadas: vec!["vivienda".into()],
    };
    actualizar_onboarding(&mut repo, &id, OnboardingData { paso1: Some(paso1), ..Default::default() }).unwrap();

    // Paso 2
    let paso2 = Paso2Data {
        activos: vec![],
        pasivos: vec![],
        inversiones: vec![crate::domain::onboarding::OnboardingInversion {
            familia: "renta_fija".into(),
            aporte_mensual: 100.0,
            valor_actual: 1000.0,
            tasa_esperada_anual: 5.0,
        }],
    };
    actualizar_onboarding(&mut repo, &id, OnboardingData { paso2: Some(paso2), ..Default::default() }).unwrap();

    // Paso 3
    let paso3 = Paso3Data {
        estrategia_deuda: Some("avalancha".into()),
        pago_extra_mensual: Some(200.0),
        supuestos_proyeccion: vec![SupuestoProyeccion { variable: "salario".into(), porcentaje: 3.0 }],
    };
    actualizar_onboarding(&mut repo, &id, OnboardingData { paso3: Some(paso3), ..Default::default() }).unwrap();

    let perfil = repo.obtener(&id).unwrap();
    assert!(perfil.onboarding_data.paso2.is_some());
    assert_eq!(perfil.onboarding_data.paso3.as_ref().unwrap().estrategia_deuda, Some("avalancha".into()));
    assert_eq!(perfil.onboarding_data.paso3.as_ref().unwrap().pago_extra_mensual, Some(200.0));
}

#[test]
fn operaciones_con_perfil_inexistente_fallan_actualizar() {
    let mut repo = MemoryPerfilRepository::new();

    let err = actualizar_onboarding(&mut repo, "inexistente", OnboardingData::default()).unwrap_err();
    assert_eq!(err.codigo(), "PerfilInexistenteError");
}