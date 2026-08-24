//! Tests para GoalEntry (REQ-23-03, REQ-23-11).

use crate::domain::onboarding::GoalEntry;

#[test]
fn goal_entry_valida_titulo_requerido() {
    let err = GoalEntry::nueva("".into(), "desc".into(), vec![]).unwrap_err();
    assert_eq!(err.codigo(), "GoalEntryTituloVacioError");
}

#[test]
fn goal_entry_valida_titulo_max_100() {
    let titulo = "a".repeat(101);
    let err = GoalEntry::nueva(titulo, "desc".into(), vec![]).unwrap_err();
    assert_eq!(err.codigo(), "GoalEntryTituloMuyLargoError");
}

#[test]
fn goal_entry_valida_descripcion_max_5000() {
    let desc = "a".repeat(5001);
    let err = GoalEntry::nueva("Titulo".into(), desc, vec![]).unwrap_err();
    assert_eq!(err.codigo(), "GoalEntryDescripcionMuyLargaError");
}

#[test]
fn goal_entry_valida_max_5_tags() {
    let tags = vec!["t1".into(), "t2".into(), "t3".into(), "t4".into(), "t5".into(), "t6".into()];
    let err = GoalEntry::nueva("Titulo".into(), "desc".into(), tags).unwrap_err();
    assert_eq!(err.codigo(), "GoalEntryDemasiadosTagsError");
}

#[test]
fn goal_entry_valida_tag_no_vacio() {
    let tags = vec!["tag1".into(), "".into()];
    let err = GoalEntry::nueva("Titulo".into(), "desc".into(), tags).unwrap_err();
    assert_eq!(err.codigo(), "GoalEntryTagVacioError");
}

#[test]
fn goal_entry_valida_tag_max_20() {
    let tag = "a".repeat(21);
    let err = GoalEntry::nueva("Titulo".into(), "desc".into(), vec![tag]).unwrap_err();
    assert_eq!(err.codigo(), "GoalEntryTagMuyLargoError");
}

#[test]
fn goal_entry_valida_ok_genera_id_y_fecha() {
    let entry = GoalEntry::nueva("Mi meta".into(), "Descripción".into(), vec!["tag1".into()]).unwrap();
    assert!(entry.id.starts_with("g_"));
    assert_eq!(entry.titulo, "Mi meta");
    assert_eq!(entry.descripcion, "Descripción");
    assert_eq!(entry.tags, vec!["tag1"]);
    assert_eq!(entry.creado_en.len(), 20);
}