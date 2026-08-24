//! Tests de la RUTA DEL COMMAND completar_onboarding (REQ-27-06, fix de
//! review ronda 2): ejercitan el núcleo real del handler #[tauri::command]
//! sobre el adapter JSON en directorio temporal. El cableado antiguo dejaba
//! el perfil SIN activar y su snapshot SIN consolidar (código muerto).

use crate::application::perfiles::{crear, seleccionar};
use crate::application::perfiles_onboarding;
use crate::commands::perfiles_onboarding_commands::completar_onboarding_core;
use crate::domain::currency::Currency;
use crate::domain::investment::InvestmentFamily;
use crate::domain::onboarding::{
    OnboardingData, OnboardingInversion, OnboardingStatus, Paso1Data,
    Paso2Data, Paso3Data,
};
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::DebtStrategy;
use crate::infrastructure::json_repository::JsonSnapshotRepository;
use crate::infrastructure::test_support::{cleanup, temp_dir};
use crate::seed;

/// Datos mínimos del wizard (pasos 1-3) para las rutas probadas.
fn datos(nombre: &str, moneda: Currency, estrategia: &str) -> OnboardingData {
    OnboardingData {
        paso1: Some(Paso1Data {
            nombre_completo: nombre.into(),
            moneda,
            fuentes_ingreso_activas: vec!["salario".into()],
            categorias_gasto_usadas: vec!["vivienda".into()],
        }),
        paso2: Some(Paso2Data {
            activos: vec![], pasivos: vec![],
            inversiones: vec![OnboardingInversion {
                familia: "renta_fija".into(), aporte_mensual: 500.0,
                valor_actual: 5000.0, tasa_esperada_anual: 7.5,
            }],
        }),
        paso3: Some(Paso3Data {
            estrategia_deuda: Some(estrategia.into()),
            pago_extra_mensual: Some(250.0),
            supuestos_proyeccion: Vec::new(),
        }),
        ..Default::default()
    }
}

#[test]
fn ruta_del_command_activa_el_perfil_y_consolida_su_snapshot() {
    let base = temp_dir("ruta_cmd_f27");
    let mut repo = JsonSnapshotRepository::new(base.clone());

    // Titular previo con SU snapshot; «Beto» aún no tiene ninguno.
    let previo = crear(&mut repo, "Previo").expect("titular previo");
    seleccionar(&mut repo, &previo.id).expect("activar previo");
    repo.save(&seed::example_snapshot()).expect("snapshot previo");

    let nuevo = crear(&mut repo, "Beto").expect("alta Beto");
    perfiles_onboarding::actualizar_onboarding(&mut repo, &nuevo.id,
        datos("Beto", Currency::Usd, "Snowball")).expect("datos del wizard");

    // Núcleo exacto que ejecuta el handler IPC completar_onboarding.
    let perfil = completar_onboarding_core(&mut repo, &nuevo.id).expect("completa");

    assert_eq!(perfil.onboarding_status, OnboardingStatus::Completed);
    // Quedó ACTIVO: la recarga posterior muestra al nuevo titular.
    assert_eq!(
        repo.cargar_registro().unwrap().unwrap().activa.as_deref(),
        Some(nuevo.id.as_str())
    );
    // Su snapshot (NO el del previo) consolidado con lo capturado.
    let snapshot = repo.load().expect("snapshot del nuevo titular");
    assert_eq!(snapshot.strategy.currency, Currency::Usd);
    assert_eq!(snapshot.strategy.debt_strategy, DebtStrategy::Snowball);
    assert_eq!(snapshot.strategy.extra_monthly_payment, 250.0);
    let renta_fija = snapshot.investments.iter()
        .find(|i| i.familia() == InvestmentFamily::RentaFija).unwrap();
    assert_eq!(renta_fija.tasa_esperada_anual(), 7.5);
    cleanup(&base);
}

#[test]
fn ruta_del_command_sin_snapshot_previo_consolida_sobre_vacio() {
    let base = temp_dir("ruta_cmd_f27_fresco");
    let mut repo = JsonSnapshotRepository::new(base.clone());
    let nuevo = crear(&mut repo, "Nueva").expect("alta Nueva");
    perfiles_onboarding::actualizar_onboarding(&mut repo, &nuevo.id,
        datos("Nueva", Currency::Eur, "Avalanche")).expect("datos del wizard");

    completar_onboarding_core(&mut repo, &nuevo.id).expect("completa");

    let snapshot = repo.load().expect("snapshot vacío + datos del wizard");
    assert_eq!(snapshot.strategy.currency, Currency::Eur);
    assert_eq!(
        repo.cargar_registro().unwrap().unwrap().activa.as_deref(),
        Some(nuevo.id.as_str())
    );
    cleanup(&base);
}
