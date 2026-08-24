//! Tests REQ-21-05/06 + REQ-30-01 del arranque sobre el adapter REAL con
//! directorios temporales: NO seed inicial (REQ-30-01), seed solo en
//! completar_onboarding, y bloqueo ante registro corrupto sin alterar datos.

use std::fs;

use super::arranque_migracion_tests::snapshot_legado;
use super::test_support::{cleanup, temp_dir};
use crate::application::arranque_perfiles::preparar_arranque;
use crate::application::perfiles::crear;
use crate::application::perfiles_onboarding;
use crate::commands::perfiles_onboarding_commands::completar_onboarding_core;
use crate::domain::currency::Currency;
use crate::domain::investment::InvestmentFamily;
use crate::domain::onboarding::{
    OnboardingData, OnboardingInversion, OnboardingStatus, Paso1Data, Paso2Data, Paso3Data,
};
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::{DebtStrategy, FinanceSnapshot};
use crate::infrastructure::json_repository::JsonSnapshotRepository;
use crate::seed;

/// Datos mínimos del wizard para las pruebas de seed en completar_onboarding.
fn datos_seed(nombre: &str, moneda: Currency, estrategia: &str) -> OnboardingData {
    OnboardingData {
        paso1: Some(Paso1Data {
            nombre_completo: nombre.into(),
            moneda,
            fuentes_ingreso_activas: vec!["salario".into()],
            categorias_gasto_usadas: vec!["vivienda".into()],
        }),
        paso2: Some(Paso2Data {
            activos: vec![],
            pasivos: vec![],
            inversiones: vec![OnboardingInversion {
                familia: "renta_fija".into(),
                aporte_mensual: 500.0,
                valor_actual: 5000.0,
                tasa_esperada_anual: 7.5,
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
fn sin_ningun_perfil_crea_inicial_sin_sembrar_seed() {
    // REQ-30-01: arranque_frio crea perfil Personal NotStarted SIN llamar ensure_seed
    let base = temp_dir("f30_sin_seed_inicial");
    let mut store = JsonSnapshotRepository::new(base.clone());
    assert!(preparar_arranque(&mut store).expect("arranque frío"));

    let registro = store.cargar_registro().unwrap().unwrap();
    assert_eq!(registro.perfiles.len(), 1);
    assert_eq!(registro.perfiles[0].nombre, "Personal");
    assert_eq!(
        registro.perfiles[0].onboarding_status,
        OnboardingStatus::NotStarted
    );
    let id = registro.activa.expect("perfil inicial activo");

    // NO existe snapshot (ni seed)
    let ruta = base.join("perfiles").join(&id).join("mfinance.json");
    assert!(
        !ruta.exists(),
        "REQ-30-01: NO debe existir snapshot tras arranque_frio (sin seed)"
    );

    // load_state falla porque no hay snapshot
    let err = store.load().expect_err("load debe fallar sin snapshot");
    let msg = err.to_string();
    assert!(
        msg.contains("no se pudo leer") || msg.contains("no se pudo cargar el snapshot"),
        "error debe ser de archivo no encontrado, got: {}",
        msg
    );

    // El guard no hace nada en arranques posteriores (no hay seed que pisar).
    assert!(!preparar_arranque(&mut store).unwrap());
    cleanup(&base);
}

#[test]
fn completar_onboarding_siembra_snapshot_vacio_minimo() {
    // REQ-30-03: completar_onboarding siembra snapshot base (vacío mínimo) si no existe
    let base = temp_dir("f30_completar_siembra");
    let mut repo = JsonSnapshotRepository::new(base.clone());

    // Arranque frío: crea perfil SIN seed
    assert!(preparar_arranque(&mut repo).expect("arranque frío"));
    let registro = repo.cargar_registro().unwrap().unwrap();
    let id = registro.activa.expect("activo").clone();

    // Rellenar onboarding y completar
    perfiles_onboarding::actualizar_onboarding(
        &mut repo,
        &id,
        datos_seed("Usuario Test", Currency::Mxn, "Avalanche"),
    )
    .expect("actualizar onboarding");

    completar_onboarding_core(&mut repo, &id).expect("completar onboarding");

    // AHORA existe snapshot (vacío mínimo + onboarding aplicado)
    let snapshot = repo.load().expect("load snapshot tras completar");
    assert_eq!(snapshot.monthly_records.len(), 0);
    assert_eq!(snapshot.assets.len(), 0);
    assert_eq!(snapshot.liabilities.len(), 0);
    assert_eq!(snapshot.account_statements.len(), 0);
    assert_eq!(snapshot.assessments.len(), 0);
    // Inversión del onboarding paso2 SÍ está presente
    assert_eq!(snapshot.investments.len(), 1);
    let inv = snapshot
        .investments
        .iter()
        .find(|i| i.familia() == InvestmentFamily::RentaFija)
        .expect("inversión renta_fija");
    assert_eq!(inv.tasa_esperada_anual(), 7.5);
    assert_eq!(snapshot.strategy.currency, Currency::Mxn);
    assert_eq!(snapshot.strategy.debt_strategy, DebtStrategy::Avalanche);
    assert_eq!(snapshot.strategy.extra_monthly_payment, 250.0);

    cleanup(&base);
}

#[test]
fn registro_corrupto_bloquea_el_arranque_sin_alterar_datos() {
    let base = temp_dir("arranque_corrupto");
    fs::write(base.join("profiles.json"), "{ roto").unwrap();
    let ruta_legado = base.join("mfinance.json");
    let bytes_legado = serde_json::to_string_pretty(&snapshot_legado()).unwrap();
    fs::write(&ruta_legado, &bytes_legado).unwrap();

    let mut store = JsonSnapshotRepository::new(base.clone());
    let error = preparar_arranque(&mut store).expect_err("debe bloquear");
    assert!(matches!(error, PerfilError::RegistroCorrupto(_)));

    assert_eq!(
        fs::read_to_string(&ruta_legado).unwrap(),
        bytes_legado,
        "los datos vigentes no se alteran"
    );
    assert!(!base.join("mfinance.pre-perfiles.json").exists());
    assert!(!base.join("perfiles").exists(), "no se escribe nada");
    cleanup(&base);
}