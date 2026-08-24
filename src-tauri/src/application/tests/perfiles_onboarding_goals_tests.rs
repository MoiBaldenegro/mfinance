//! Tests para CRUD de goals (REQ-23-03, REQ-23-11).

use crate::application::perfiles_onboarding::goals::{agregar_goal, actualizar_goal, eliminar_goal};
use crate::application::perfiles_onboarding::actualizar::actualizar_onboarding;
use crate::application::tests::memory_perfil_repository::MemoryPerfilRepository;
use crate::domain::onboarding::{OnboardingData, OnboardingStatus, Paso1Data};
use crate::domain::currency::Currency;

fn repo_con_perfil() -> (MemoryPerfilRepository, String) {
    let mut repo = MemoryPerfilRepository::new();
    let perfil = repo.crear("Test").unwrap();
    (repo, perfil.id)
}

#[test]
fn goal_crud_completo() {
    let (mut repo, id) = repo_con_perfil();

    // Crear
    let goal = agregar_goal(&mut repo, &id, "Meta 1".into(), "Desc".into(), vec!["tag1".into()]).unwrap();
    assert_eq!(goal.titulo, "Meta 1");
    assert!(!goal.id.is_empty());

    // Leer
    let perfil = repo.obtener(&id).unwrap();
    assert_eq!(perfil.goals_journal.len(), 1);

    // Actualizar
    let goal2 = actualizar_goal(&mut repo, &id, &goal.id, "Meta 2".into(), "Desc 2".into(), vec!["tag2".into()]).unwrap();
    assert_eq!(goal2.titulo, "Meta 2");
    assert_eq!(goal2.id, goal.id); // id preservado

    // Eliminar
    eliminar_goal(&mut repo, &id, &goal.id).unwrap();
    let perfil = repo.obtener(&id).unwrap();
    assert!(perfil.goals_journal.is_empty());
}

#[test]
fn goal_validacion_rechaza_invalidos() {
    let (mut repo, id) = repo_con_perfil();

    // Título vacío
    let err = agregar_goal(&mut repo, &id, "".into(), "desc".into(), vec![]).unwrap_err();
    assert_eq!(err.codigo(), "PerfilPersistenciaError");

    // Título muy largo
    let err = agregar_goal(&mut repo, &id, "a".repeat(101), "desc".into(), vec![]).unwrap_err();
    assert_eq!(err.codigo(), "PerfilPersistenciaError");

    // Demasiados tags
    let tags = (0..6).map(|i| format!("t{}", i)).collect();
    let err = agregar_goal(&mut repo, &id, "Titulo".into(), "desc".into(), tags).unwrap_err();
    assert_eq!(err.codigo(), "PerfilPersistenciaError");

    // Tag vacío
    let err = agregar_goal(&mut repo, &id, "Titulo".into(), "desc".into(), vec!["tag1".into(), "".into()]).unwrap_err();
    assert_eq!(err.codigo(), "PerfilPersistenciaError");
}

#[test]
fn operaciones_con_perfil_inexistente_fallan_goals() {
    let mut repo = MemoryPerfilRepository::new();

    let err = agregar_goal(&mut repo, "inexistente", "Titulo".into(), "desc".into(), vec![]).unwrap_err();
    assert_eq!(err.codigo(), "PerfilInexistenteError");

    let err = eliminar_goal(&mut repo, "inexistente", "goal-id").unwrap_err();
    assert_eq!(err.codigo(), "PerfilInexistenteError");

    let err = actualizar_goal(&mut repo, "inexistente", "goal-id", "Titulo".into(), "desc".into(), vec![]).unwrap_err();
    assert_eq!(err.codigo(), "PerfilInexistenteError");
}