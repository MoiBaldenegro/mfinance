//! Tests REQ-28-01/02/03 del REINICIO contra el adapter REAL con
//! directorios temporales: profiles.json preexistente + snapshot del
//! activo en perfiles/<id>/mfinance.json. Hoy (pre-fix) falla con «sin
//! perfil activo»: los dobles en memoria no modelaban este campo.

use super::arranque28_soporte::{
    escribir_registro, escribir_snapshot, perfil, snapshot_con,
};
use super::test_support::{cleanup, temp_dir};
use crate::application::arranque_perfiles::preparar_arranque;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::registro_perfiles::RegistroPerfiles;
use crate::domain::repository::SnapshotRepository;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

#[test]
fn cargar_registro_restaura_el_activo_en_memoria_del_adapter() {
    let base = temp_dir("f28_restaura_activo");
    escribir_registro(
        &base,
        &RegistroPerfiles {
            activa: Some("p_uno".to_string()),
            perfiles: vec![perfil("p_uno", "Uno")],
        },
    );
    let mut store = JsonSnapshotRepository::new(base.clone());
    assert!(
        store.cargar_registro().expect("lectura").is_some(),
        "el registro existe en disco"
    );
    assert_eq!(
        store.activo(),
        Some("p_uno"),
        "REQ-28-01: leer restaura el activo persistido"
    );
    cleanup(&base);
}

#[test]
fn reinicio_restaura_el_activo_y_load_devuelve_su_snapshot() {
    let base = temp_dir("f28_reinicio");
    let datos = snapshot_con(555.0);
    escribir_snapshot(&base, "p_aaa", &datos);
    escribir_registro(
        &base,
        &RegistroPerfiles {
            activa: Some("p_aaa".to_string()),
            perfiles: vec![perfil("p_aaa", "Ana")],
        },
    );

    // Adapter recién construido: idéntico a un proceso tras reiniciar.
    let mut store = JsonSnapshotRepository::new(base.clone());
    assert_eq!(
        store.activo(),
        None,
        "un adapter nuevo arranca sin activo en memoria"
    );

    assert!(
        !preparar_arranque(&mut store).expect("registro existente"),
        "REQ-28-02: no repite alta, siembra ni migración"
    );
    assert_eq!(
        store.activo(),
        Some("p_aaa"),
        "REQ-28-02: el repositorio queda sobre el activo restaurado"
    );
    assert_eq!(
        store.load().expect("load tras reinicio"),
        datos,
        "REQ-28-03: load devuelve EXACTAMENTE su snapshot"
    );
    cleanup(&base);
}
