//! Tests REQ-22-02/04 de la lectura del perfil activo que alimenta a la
//! UI (cabecera y marca de activo). Contra el doble en memoria del
//! puerto, igual que perfiles_casos_tests.

use super::memory_perfil_repository::MemoryPerfilRepository;
use crate::application::perfiles::{activo, crear, seleccionar};
use crate::domain::perfil_errors::PerfilError;

#[test]
fn sin_registro_no_hay_perfil_activo() {
    let mut repo = MemoryPerfilRepository::default();
    assert_eq!(activo(&mut repo).expect("lectura"), None);
}

#[test]
fn devuelve_el_activo_tras_seleccionar() {
    let mut repo = MemoryPerfilRepository::default();
    let _ana = crear(&mut repo, "Ana").expect("alta Ana");
    let beto = crear(&mut repo, "Beto").expect("alta Beto");
    seleccionar(&mut repo, &beto.id).expect("activación");
    let leido = activo(&mut repo).expect("lectura");
    assert_eq!(leido.map(|p| p.id), Some(beto.id));
}

#[test]
fn registro_corrupto_propaga_error_nombrado() {
    let mut repo = MemoryPerfilRepository::default();
    repo.corrupto = true;
    assert!(matches!(
        activo(&mut repo),
        Err(PerfilError::RegistroCorrupto(_))
    ));
}
