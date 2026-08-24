//! Test REQ-28-09 de conservación contra el adapter REAL: la
//! autorecuperación del arranque repara el indicador de activo SIN
//! borrar ni reescribir los snapshots ni los registros ajenos.

use std::fs;

use super::arranque28_soporte::{
    escribir_registro, escribir_snapshot, leer_registro, perfil, snapshot_con,
};
use super::recuperacion_deadend_tests::registro;
use super::test_support::{cleanup, temp_dir};
use crate::application::arranque_perfiles::preparar_arranque;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

#[test]
fn la_recuperacion_conserva_los_snapshots_y_registros_ajenos() {
    let base = temp_dir("f28_conservacion");
    let datos_uno = snapshot_con(444.0);
    let datos_dos = snapshot_con(555.5);
    escribir_snapshot(&base, "p_uno", &datos_uno);
    escribir_snapshot(&base, "p_dos", &datos_dos);
    let ruta_uno = base.join("perfiles").join("p_uno").join("mfinance.json");
    let ruta_dos = base.join("perfiles").join("p_dos").join("mfinance.json");
    let bytes_uno = fs::read_to_string(&ruta_uno).unwrap();
    let bytes_dos = fs::read_to_string(&ruta_dos).unwrap();
    escribir_registro(
        &base,
        &registro(Some("p_fantasma"), &["p_uno", "p_dos"]),
    );

    let mut store = JsonSnapshotRepository::new(base.clone());
    assert!(!preparar_arranque(&mut store).expect("autorecuperación"));
    assert_eq!(
        store.activo(),
        Some("p_uno"),
        "la recuperación SÍ ocurrió antes de comparar conservación"
    );
    assert_eq!(
        fs::read_to_string(&ruta_uno).unwrap(),
        bytes_uno,
        "REQ-28-09: snapshot de p_uno byte a byte intacto"
    );
    assert_eq!(
        fs::read_to_string(&ruta_dos).unwrap(),
        bytes_dos,
        "REQ-28-09: snapshot de p_dos byte a byte intacto"
    );
    let vigente = leer_registro(&base);
    assert_eq!(vigente.perfiles.len(), 2, "ningún perfil desaparece");
    for p in &vigente.perfiles {
        assert!(
            p.nombre.starts_with("Titular"),
            "los registros ajenos no se reescriben"
        );
    }
    cleanup(&base);
}

/// Los perfiles fixture conservan su nombre original tras reparar.
#[test]
fn los_nombres_de_los_perfiles_ajenos_no_se_alteran() {
    let base = temp_dir("f28_nombres_intactos");
    escribir_registro(
        &base,
        &crate::domain::registro_perfiles::RegistroPerfiles {
            activa: None,
            perfiles: vec![
                perfil("p_ana", "Ana García"),
                perfil("p_beto", "Beto López"),
            ],
        },
    );
    escribir_snapshot(&base, "p_beto", &snapshot_con(9.0));

    let mut store = JsonSnapshotRepository::new(base.clone());
    preparar_arranque(&mut store).expect("autorecuperación");
    let nombres: Vec<String> = leer_registro(&base)
        .perfiles
        .into_iter()
        .map(|p| p.nombre)
        .collect();
    assert_eq!(
        nombres,
        vec!["Ana García".to_string(), "Beto López".to_string()]
    );
    cleanup(&base);
}
