//! Tests REQ-21-01/06 del registro de perfiles sobre el adapter real
//! con directorios temporales: round-trip del registro, detección de
//! profiles.json corrupto y fallos nombrados sin perfil activo.

use std::fs;

use super::test_support::{cleanup, temp_dir};
use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::registro_perfiles::RegistroPerfiles;
use crate::domain::repository::SnapshotRepository;
use crate::infrastructure::json_repository::JsonSnapshotRepository;
use crate::seed;

fn ruta_registro(base: &std::path::Path) -> std::path::PathBuf {
    base.join("profiles.json")
}

#[test]
fn registro_round_trip_conserva_activa_y_perfiles() {
    let base = temp_dir("registro_rt");
    let mut store = JsonSnapshotRepository::new(base.clone());
    assert_eq!(store.cargar_registro().expect("sin archivo"), None);

    let esperado = RegistroPerfiles {
        activa: Some("p_a".to_string()),
        perfiles: vec![Perfil::nuevo("Ana")],
    };
    store.guardar_registro(&esperado).expect("guardar registro");
    assert_eq!(
        store.cargar_registro().expect("cargar registro"),
        Some(esperado),
        "el registro viaja idéntico ida y vuelta"
    );
    cleanup(&base);
}

#[test]
fn profiles_json_corrupto_produce_error_nombrado_sin_alterar_datos() {
    let base = temp_dir("registro_corrupto");
    let mut store = JsonSnapshotRepository::new(base.clone());
    fs::write(ruta_registro(&base), "{ esto no es json").unwrap();

    let error = store.cargar_registro().expect_err("corrupto debe fallar");
    match &error {
        PerfilError::RegistroCorrupto(motivo) => {
            assert!(motivo.contains("profiles.json"), "motivo: {motivo}");
        }
        otro => panic!("error equivocado: {otro:?}"),
    }
    // El archivo corrupto queda tal cual: jamás se pisa en silencio.
    assert!(ruta_registro(&base).is_file());
    cleanup(&base);
}

#[test]
fn snapshots_sin_perfil_activo_fallan_nombrados() {
    let base = temp_dir("sin_activo");
    let mut store = JsonSnapshotRepository::new(base.clone());
    let carga = store.load().expect_err("load sin activo");
    assert!(carga.to_string().contains("perfil activo"));
    let guardado =
        store.save(&seed::example_snapshot()).expect_err("save sin activo");
    assert!(guardado.to_string().contains("perfil activo"));
    cleanup(&base);
}
