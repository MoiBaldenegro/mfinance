//! Tests para el command obtener_perfil_activo_con_onboarding (REQ-29-01).
//! Verifica que devuelve { snapshot, onboarding_status } del perfil activo
//! con los tres estados: NotStarted, InProgress, Completed.

use crate::domain::catalogs::{IncomeSource, ExpenseCategory};
use crate::domain::month_key::MonthKey;
use crate::domain::onboarding::OnboardingStatus;
use crate::domain::perfil::Perfil;
use crate::domain::registro_perfiles::RegistroPerfiles;
use crate::domain::snapshot::FinanceSnapshot;
use crate::infrastructure::json_repository::JsonSnapshotRepository;
use crate::infrastructure::test_support::{cleanup, temp_dir};
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::repository::SnapshotRepository;
use crate::application::load_state;
use crate::application::perfiles_onboarding;

#[test]
fn obtener_perfil_activo_con_onboarding_not_started_devuelve_snapshot_y_estado() {
    let dir = temp_dir("not_started");
    let mut repo = JsonSnapshotRepository::new(dir.clone());

    // Crear registro con perfil activo NotStarted
    let perfil_id = "p_test_not_started";
    repo.guardar_registro(&RegistroPerfiles {
        activa: Some(perfil_id.to_string()),
        perfiles: vec![Perfil {
            id: perfil_id.to_string(),
            nombre: "Test User".to_string(),
            creado_en: "2026-08-24T00:00:00Z".to_string(),
            onboarding_status: OnboardingStatus::NotStarted,
            onboarding_data: crate::domain::onboarding::OnboardingData::default(),
            goals_journal: Vec::new(),
            financial_profile: crate::domain::onboarding::FinancialProfile::default(),
        }],
    })
    .expect("guardar registro");

    // Cargar registro para restaurar el activo en el adapter
    repo.cargar_registro().expect("cargar registro restaura activo");

    // Crear snapshot vacío para el perfil
    repo.save(&FinanceSnapshot::default()).expect("guardar snapshot vacío");

    // Test: load_state devuelve snapshot
    let snapshot = load_state::load_state(&repo).expect("load_state ok");
    assert_eq!(snapshot.monthly_records.len(), 0);

    // Test: obtener_onboarding_status devuelve NotStarted
    let status = perfiles_onboarding::obtener_onboarding_status(&mut repo, perfil_id)
        .expect("obtener_onboarding_status ok");
    assert!(matches!(status, OnboardingStatus::NotStarted));

    cleanup(&dir);
}

#[test]
fn obtener_perfil_activo_con_onboarding_in_progress_devuelve_snapshot_y_estado() {
    let dir = temp_dir("in_progress");
    let mut repo = JsonSnapshotRepository::new(dir.clone());

    let perfil_id = "p_test_in_progress";
    repo.guardar_registro(&RegistroPerfiles {
        activa: Some(perfil_id.to_string()),
        perfiles: vec![Perfil {
            id: perfil_id.to_string(),
            nombre: "Test User".to_string(),
            creado_en: "2026-08-24T00:00:00Z".to_string(),
            onboarding_status: OnboardingStatus::InProgress { current_step: 3 },
            onboarding_data: crate::domain::onboarding::OnboardingData::default(),
            goals_journal: Vec::new(),
            financial_profile: crate::domain::onboarding::FinancialProfile::default(),
        }],
    })
    .expect("guardar registro");

    repo.cargar_registro().expect("cargar registro restaura activo");
    repo.save(&FinanceSnapshot::default()).expect("guardar snapshot vacío");

    let snapshot = load_state::load_state(&repo).expect("load_state ok");
    assert_eq!(snapshot.monthly_records.len(), 0);

    let status = perfiles_onboarding::obtener_onboarding_status(&mut repo, perfil_id)
        .expect("obtener_onboarding_status ok");
    assert!(matches!(status, OnboardingStatus::InProgress { current_step: 3 }));

    cleanup(&dir);
}

#[test]
fn obtener_perfil_activo_con_onboarding_completed_devuelve_snapshot_y_estado() {
    let dir = temp_dir("completed");
    let mut repo = JsonSnapshotRepository::new(dir.clone());

    let perfil_id = "p_test_completed";
    repo.guardar_registro(&RegistroPerfiles {
        activa: Some(perfil_id.to_string()),
        perfiles: vec![Perfil {
            id: perfil_id.to_string(),
            nombre: "Test User".to_string(),
            creado_en: "2026-08-24T00:00:00Z".to_string(),
            onboarding_status: OnboardingStatus::Completed,
            onboarding_data: crate::domain::onboarding::OnboardingData::default(),
            goals_journal: Vec::new(),
            financial_profile: crate::domain::onboarding::FinancialProfile::default(),
        }],
    })
    .expect("guardar registro");

    repo.cargar_registro().expect("cargar registro restaura activo");

    // Snapshot con datos de ejemplo (simulando seed)
    let mut snapshot = FinanceSnapshot::default();
    snapshot.monthly_records.push(crate::domain::monthly_record::MonthlyRecord::new(
        MonthKey::parse("2026-07").unwrap(),
        [(IncomeSource::Salario, 2000.0)],
        [(ExpenseCategory::Vivienda, 800.0)],
    ));
    repo.save(&snapshot).expect("guardar snapshot con datos");

    let snapshot_cargado = load_state::load_state(&repo).expect("load_state ok");
    assert_eq!(snapshot_cargado.monthly_records.len(), 1);

    let status = perfiles_onboarding::obtener_onboarding_status(&mut repo, perfil_id)
        .expect("obtener_onboarding_status ok");
    assert!(matches!(status, OnboardingStatus::Completed));

    cleanup(&dir);
}

#[test]
fn obtener_perfil_activo_con_onboarding_legacy_migracion_completed_no_wizard() {
    let dir = temp_dir("legacy_completed");
    let mut repo = JsonSnapshotRepository::new(dir.clone());

    // Perfil legacy migrado: onboarding_status = Completed por defecto (feature 23)
    let perfil_id = "p_legacy";
    repo.guardar_registro(&RegistroPerfiles {
        activa: Some(perfil_id.to_string()),
        perfiles: vec![Perfil {
            id: perfil_id.to_string(),
            nombre: "Usuario Legacy".to_string(),
            creado_en: "2026-01-01T00:00:00Z".to_string(),
            onboarding_status: OnboardingStatus::Completed, // Migración feature 23
            onboarding_data: crate::domain::onboarding::OnboardingData::default(),
            goals_journal: Vec::new(),
            financial_profile: crate::domain::onboarding::FinancialProfile::default(),
        }],
    })
    .expect("guardar registro legacy");

    repo.cargar_registro().expect("cargar registro restaura activo");
    repo.save(&FinanceSnapshot::default()).expect("guardar snapshot");

    let status = perfiles_onboarding::obtener_onboarding_status(&mut repo, perfil_id)
        .expect("obtener_onboarding_status ok");
    assert!(matches!(status, OnboardingStatus::Completed));

    cleanup(&dir);
}