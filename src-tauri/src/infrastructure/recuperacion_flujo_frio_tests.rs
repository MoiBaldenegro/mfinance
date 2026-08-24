//! Tests REQ-28-07/08 + REQ-30-01/02 de autorecuperación contra el adapter REAL:
//! registro sin snapshots legibles (R3: SOLO persiste activo, NO siembra) y
//! registro vacío de perfiles (flujo frío: crea perfil NotStarted SIN seed).

use std::fs;

use super::arranque28_soporte::{
    escribir_registro, leer_registro, perfil, snapshot_con,
};
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
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::registro_perfiles::RegistroPerfiles;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;
use crate::infrastructure::json_repository::JsonSnapshotRepository;
use crate::infrastructure::rutas_mfinance;

fn snapshot_de(base: &std::path::Path, id: &str) -> FinanceSnapshot {
    let ruta = rutas_mfinance::snapshot_de(base, id);
    serde_json::from_str(&fs::read_to_string(ruta).expect("leer snapshot"))
        .expect("snapshot válido")
}

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
fn sin_ningun_snapshot_legible_r3_persiste_activo_sin_sembrar() {
    // REQ-30-02: R3 (nadie tiene snapshot legible) → persistir el primero como activo, NO sembrar
    let base = temp_dir("f30_cero_snapshots_r3");
    let perfiles = vec![perfil("p_uno", "Uno"), perfil("p_dos", "Dos")];
    escribir_registro(
        &base,
        &RegistroPerfiles { activa: None, perfiles },
    );
    let mut store = JsonSnapshotRepository::new(base.clone());
    assert!(!preparar_arranque(&mut store).expect("autorecuperación R3"));
    assert_eq!(store.activo(), Some("p_uno"), "queda activo el primero");

    // REQ-30-02: NO hay snapshot sembrado
    assert!(
        !rutas_mfinance::snapshot_de(&base, "p_uno").exists(),
        "REQ-30-02: R3 NO debe sembrar snapshot"
    );
    assert!(
        !rutas_mfinance::snapshot_de(&base, "p_dos").exists(),
        "REQ-30-02: R3 NO debe sembrar en ninguno"
    );
    assert_eq!(
        leer_registro(&base).activa.as_deref(),
        Some("p_uno"),
        "la elección queda persistida"
    );

    // load falla porque no hay snapshot
    let err = store.load().expect_err("load debe fallar sin snapshot");
    let msg = err.to_string();
    assert!(
        msg.contains("no se pudo leer") || msg.contains("no se pudo cargar el snapshot"),
        "error debe ser de archivo no encontrado, got: {}",
        msg
    );
    cleanup(&base);
}

#[test]
fn registro_sin_perfiles_flujo_frio_crea_inicial_sin_seed() {
    // REQ-30-01: flujo frío (registro vacío) → crea perfil Personal NotStarted SIN seed
    let base = temp_dir("f30_vacio_sin_seed");
    escribir_registro(
        &base,
        &RegistroPerfiles { activa: None, perfiles: vec![] },
    );
    let mut store = JsonSnapshotRepository::new(base.clone());
    assert!(
        preparar_arranque(&mut store).expect("flujo frío"),
        "REQ-30-01: alta del perfil inicial"
    );
    let vigente = leer_registro(&base);
    assert_eq!(vigente.perfiles.len(), 1);
    assert_eq!(vigente.perfiles[0].nombre, "Personal");
    assert_eq!(
        vigente.perfiles[0].onboarding_status,
        OnboardingStatus::NotStarted
    );
    let id = vigente.activa.expect("activo").clone();
    assert_eq!(vigente.perfiles[0].id, id);

    // REQ-30-01: NO hay snapshot (ni seed)
    assert!(
        !rutas_mfinance::snapshot_de(&base, &id).exists(),
        "REQ-30-01: NO debe existir snapshot tras flujo frío"
    );
    cleanup(&base);
}

#[test]
fn registro_sin_perfiles_adopta_el_legado_pendiente_sin_seed_adicional() {
    // REQ-30-01 + REQ-21-04: flujo frío con legado → adopta legado, NO siembra seed adicional
    let base = temp_dir("f30_vacio_legado");
    let legado = snapshot_con(777.0);
    fs::write(
        rutas_mfinance::legado(&base),
        serde_json::to_string_pretty(&legado).unwrap(),
    )
    .unwrap();
    escribir_registro(
        &base,
        &RegistroPerfiles { activa: None, perfiles: vec![] },
    );
    let mut store = JsonSnapshotRepository::new(base.clone());
    assert!(preparar_arranque(&mut store).expect("flujo frío con legado"));
    let id = leer_registro(&base).activa.expect("activo");
    assert_eq!(
        snapshot_de(&base, &id),
        legado,
        "REQ-21-04: adopción del legado pendiente al primer perfil"
    );
    // REQ-30-01: NO hay seed adicional encima del legado
    assert!(
        !rutas_mfinance::legado(&base).is_file(),
        "el legado original queda retirado del camino de carga"
    );
    assert!(rutas_mfinance::backup_legado(&base).is_file());
    cleanup(&base);
}

#[test]
fn completar_onboarding_siembra_snapshot_en_perfil_sin_datos() {
    // REQ-30-03: completar_onboarding siembra snapshot (vacío mínimo + onboarding) si no existe
    let base = temp_dir("f30_completar_siembra_r3");
    // Simular perfil creado por R3 (activo sin snapshot)
    let perfiles = vec![perfil("p_uno", "Uno"), perfil("p_dos", "Dos")];
    escribir_registro(
        &base,
        &RegistroPerfiles { activa: Some("p_uno".to_string()), perfiles },
    );

    let mut repo = JsonSnapshotRepository::new(base.clone());
    repo.cargar_registro().expect("cargar registro restaura activo");

    // Rellenar onboarding y completar para p_uno
    perfiles_onboarding::actualizar_onboarding(
        &mut repo,
        "p_uno",
        datos_seed("Usuario Uno", Currency::Mxn, "Avalanche"),
    )
    .expect("actualizar onboarding");

    completar_onboarding_core(&mut repo, "p_uno").expect("completar onboarding");

    // AHORA existe snapshot para p_uno (vacío mínimo + onboarding)
    let snapshot = repo.load().expect("load snapshot tras completar");
    assert_eq!(snapshot.monthly_records.len(), 0);
    assert_eq!(snapshot.investments.len(), 1);
    let inv = snapshot
        .investments
        .iter()
        .find(|i| i.familia() == InvestmentFamily::RentaFija)
        .expect("inversión renta_fija");
    assert_eq!(inv.tasa_esperada_anual(), 7.5);

    // p_dos sigue SIN snapshot
    assert!(
        !rutas_mfinance::snapshot_de(&base, "p_dos").exists(),
        "p_dos no debe tener snapshot (no completó onboarding)"
    );
    cleanup(&base);
}