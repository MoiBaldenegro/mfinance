//! Tests REQ-04-02 de ensure_seed y de los casos load_state/save_state
//! orquestando vía el puerto con el doble en memoria.

use super::memory_repository::MemoryRepository;
use crate::application::{ensure_seed, load_state, save_state};
use crate::domain::repository_errors::{
    SnapshotLoadError, SnapshotSaveError,
};
use crate::seed;

#[test]
fn ensure_seed_persists_example_when_nothing_is_stored() {
    let mut repo = MemoryRepository::default();
    let seeded =
        ensure_seed::ensure_seed(&mut repo).expect("siembra inicial");
    assert!(seeded, "la primera vez debe sembrar");
    assert_eq!(repo.stored, Some(seed::example_snapshot()));
}

#[test]
fn ensure_seed_is_a_no_op_when_data_already_exists() {
    let mut repo = MemoryRepository::default();
    repo.stored = Some(seed::example_snapshot());
    let seeded =
        ensure_seed::ensure_seed(&mut repo).expect("con datos no siembra");
    assert!(!seeded);
    assert_eq!(repo.stored, Some(seed::example_snapshot()));
}

#[test]
fn load_state_returns_the_stored_snapshot() {
    let mut repo = MemoryRepository::default();
    repo.stored = Some(seed::example_snapshot());
    let loaded = load_state::load_state(&repo).expect("carga feliz");
    assert_eq!(loaded, seed::example_snapshot());
}

#[test]
fn load_state_propagates_the_named_port_error() {
    let mut repo = MemoryRepository::default();
    repo.fail_load = true;
    let error = load_state::load_state(&repo).expect_err("fallo inyectado");
    assert!(matches!(error, SnapshotLoadError { .. }));
}

#[test]
fn save_state_persists_through_the_port() {
    let mut repo = MemoryRepository::default();
    let snapshot = seed::example_snapshot();
    save_state::save_state(&mut repo, &snapshot).expect("guardado feliz");
    assert_eq!(repo.stored, Some(snapshot));
}

#[test]
fn save_state_propagates_the_named_save_error() {
    let mut repo = MemoryRepository::default();
    repo.fail_save = true;
    let error = save_state::save_state(&mut repo, &seed::example_snapshot())
        .expect_err("fallo inyectado");
    assert!(matches!(error, SnapshotSaveError { .. }));
}
