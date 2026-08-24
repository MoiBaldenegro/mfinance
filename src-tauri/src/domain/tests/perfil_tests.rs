//! Tests REQ-21-01, REQ-23-01 a 23-04 de la entidad Perfil extendida:
//! creación con id único, onboarding fields, round-trip JSON, migración legacy.

use crate::domain::onboarding::OnboardingStatus;
use crate::domain::perfil::{nuevo_id, Perfil};

#[test]
fn ids_generados_en_rafaga_son_todos_unicos() {
    use std::collections::HashSet;
    let ids: Vec<String> = (0..1000).map(|_| nuevo_id()).collect();
    let unicos: HashSet<&String> = ids.iter().collect();
    assert_eq!(
        unicos.len(),
        ids.len(),
        "cada id debe ser único aunque se generen en ráfaga"
    );
}

#[test]
fn los_ids_llevan_el_prefijo_del_esquema() {
    for _ in 0..50 {
        let id = nuevo_id();
        assert!(id.starts_with("p_"), "formato p_<hex>: {id}");
        assert!(id.len() > 4, "el id debe tener contenido tras el prefijo");
    }
}

#[test]
fn perfil_nuevo_rellena_id_nombre_y_fecha_de_creacion() {
    let perfil = Perfil::nuevo("Ana");
    assert_eq!(perfil.nombre, "Ana");
    assert!(perfil.id.starts_with("p_"), "id generado: {}", perfil.id);
    assert_eq!(
        perfil.creado_en.len(),
        20,
        "creado_en debe ser una fecha ISO-8601 UTC"
    );
}

#[test]
fn perfil_nuevo_tiene_onboarding_not_started() {
    let p = Perfil::nuevo("Ana");
    assert_eq!(p.onboarding_status, OnboardingStatus::NotStarted);
    assert!(p.onboarding_data.paso1.is_none());
    assert!(p.goals_journal.is_empty());
    assert!(p.financial_profile.fuentes_ingreso_activas.is_empty());
}

#[test]
fn perfil_legacy_migrado_tiene_onboarding_completed() {
    let p = Perfil::legacy_migrado("Legacy");
    assert_eq!(p.onboarding_status, OnboardingStatus::Completed);
    assert!(p.onboarding_data.paso1.is_none());
    assert!(p.goals_journal.is_empty());
    assert!(p.financial_profile.fuentes_ingreso_activas.is_empty());
}

#[test]
fn perfil_roundtrip_json_conserva_campos_onboarding() {
    let mut p = Perfil::nuevo("Test");
    p.onboarding_status = OnboardingStatus::InProgress { current_step: 2 };
    p.onboarding_data.paso1 = Some(crate::domain::onboarding::Paso1Data {
        nombre_completo: "Test User".into(),
        moneda: crate::domain::currency::Currency::Mxn,
        fuentes_ingreso_activas: vec!["salario".into()],
        categorias_gasto_usadas: vec!["vivienda".into()],
    });
    p.goals_journal.push(crate::domain::onboarding::GoalEntry::nueva(
        "Meta 1".into(),
        "Desc".into(),
        vec!["tag1".into()],
    ).unwrap());
    p.financial_profile.fuentes_ingreso_activas = vec!["salario".into()];

    let json = serde_json::to_string(&p).unwrap();
    let p2: Perfil = serde_json::from_str(&json).unwrap();

    assert_eq!(p2.id, p.id);
    assert_eq!(p2.nombre, p.nombre);
    assert_eq!(p2.onboarding_status, p.onboarding_status);
    assert_eq!(p2.onboarding_data, p.onboarding_data);
    assert_eq!(p2.goals_journal, p.goals_journal);
    assert_eq!(p2.financial_profile, p.financial_profile);
}

#[test]
fn perfil_legacy_sin_campos_onboarding_deserializa_con_defaults() {
    // JSON antiguo sin campos de onboarding
    let json = r#"{"id":"p_test","nombre":"Legacy","creado_en":"2024-01-01T00:00:00Z"}"#;
    let p: Perfil = serde_json::from_str(json).unwrap();
    assert_eq!(p.onboarding_status, OnboardingStatus::Completed);
    assert!(p.onboarding_data.paso1.is_none());
    assert!(p.goals_journal.is_empty());
    assert!(p.financial_profile.fuentes_ingreso_activas.is_empty());
}