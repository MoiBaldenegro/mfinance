//! Tests REQ-28-05/06/09 de autorecuperación contra el adapter REAL:
//! dead-ends del registro existente (activa nula, huérfana o cuyo
//! snapshot falta) y conservación íntegra de los datos ajenos.


use super::arranque28_soporte::{
    escribir_registro, escribir_snapshot, leer_registro, perfil, snapshot_con,
};
use super::test_support::{cleanup, temp_dir};
use crate::application::arranque_perfiles::preparar_arranque;
use crate::domain::registro_perfiles::RegistroPerfiles;
use crate::domain::repository::SnapshotRepository;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

/// Registro de prueba con activa e ids fijos.
pub(crate) fn registro(activa: Option<&str>, ids: &[&str]) -> RegistroPerfiles {
    RegistroPerfiles {
        activa: activa.map(str::to_string),
        perfiles: ids.iter().enumerate()
            .map(|(n, id)| perfil(id, &format!("Titular{n}")))
            .collect(),
    }
}

#[test]
fn activa_nula_recupera_el_primer_perfil_con_snapshot() {
    let base = temp_dir("f28_activa_nula");
    let datos_dos = snapshot_con(111.0);
    escribir_snapshot(&base, "p_dos", &datos_dos);
    escribir_registro(&base, &registro(None, &["p_uno", "p_dos"]));

    let mut store = JsonSnapshotRepository::new(base.clone());
    assert!(!preparar_arranque(&mut store).expect("autorecuperación"));
    assert_eq!(
        store.activo(),
        Some("p_dos"),
        "elige el PRIMERO con snapshot en disco (p_uno no tiene)"
    );
    assert_eq!(
        leer_registro(&base).activa.as_deref(),
        Some("p_dos"),
        "REQ-28-05: la elección queda persistida"
    );
    assert_eq!(store.load().expect("carga tras recuperar"), datos_dos);
    cleanup(&base);
}

#[test]
fn activo_huerfano_recupera_el_primer_perfil_con_snapshot() {
    let base = temp_dir("f28_huerfano");
    let datos = snapshot_con(222.0);
    escribir_snapshot(&base, "p_uno", &datos);
    escribir_registro(
        &base,
        &registro(Some("p_fantasma"), &["p_uno", "p_dos"]),
    );

    let mut store = JsonSnapshotRepository::new(base.clone());
    assert!(!preparar_arranque(&mut store).expect("autorecuperación"));
    assert_eq!(store.activo(), Some("p_uno"), "REQ-28-06");
    assert_eq!(leer_registro(&base).activa.as_deref(), Some("p_uno"));
    assert_eq!(store.load().expect("carga tras recuperar"), datos);
    cleanup(&base);
}

#[test]
fn snapshot_del_activo_faltante_recupera_otro_con_datos() {
    let base = temp_dir("f28_sin_archivo_activo");
    let datos = snapshot_con(333.0);
    escribir_snapshot(&base, "p_uno", &datos);
    // p_dos está activo pero su archivo NUNCA llegó a escribirse.
    escribir_registro(
        &base,
        &registro(Some("p_dos"), &["p_uno", "p_dos"]),
    );

    let mut store = JsonSnapshotRepository::new(base.clone());
    assert!(!preparar_arranque(&mut store).expect("autorecuperación"));
    assert_eq!(
        store.activo(),
        Some("p_uno"),
        "REQ-28-06: el activo sin snapshot cae al primero con datos"
    );
    assert_eq!(leer_registro(&base).activa.as_deref(), Some("p_uno"));
    assert_eq!(store.load().expect("carga tras recuperar"), datos);
    cleanup(&base);
}
