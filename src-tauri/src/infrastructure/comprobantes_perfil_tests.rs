//! Test REQ-21-07 del aislamiento de comprobantes: la ruta de
//! almacenamiento incluye el id del perfil configurado, sobre
//! directorios temporales (nunca Documents real).

use super::test_support::{cleanup, temp_dir};
use crate::domain::puertos_pdf::ComprobantesStore;
use crate::infrastructure::comprobantes_fs::ComprobantesFsRepository;

#[test]
fn la_ruta_de_comprobantes_incluye_el_id_del_perfil_activo() {
    let dir = temp_dir("comp_perfil");
    let mut store = ComprobantesFsRepository::new(dir.join("comprobantes"));
    store.set_perfil("p_abc".to_string());

    store
        .guardar("2026-06", "extracto.pdf", b"%PDF-1.4")
        .expect("guardar");

    let esperada = dir
        .join("comprobantes")
        .join("p_abc")
        .join("2026-06")
        .join("extracto.pdf");
    assert!(
        esperada.is_file(),
        "debe vivir bajo comprobantes/<perfilId>/<mes>/"
    );
    assert_eq!(
        store.listar("2026-06").expect("listar"),
        vec!["extracto.pdf".to_string()]
    );
    assert_eq!(
        store.leer("2026-06", "extracto.pdf").expect("leer"),
        b"%PDF-1.4".to_vec()
    );
    cleanup(&dir);
}

#[test]
fn perfiles_distintos_no_comparten_carpetas_de_comprobantes() {
    let dir = temp_dir("comp_dos_perfiles");
    let mut store = ComprobantesFsRepository::new(dir.join("comprobantes"));

    store.set_perfil("p_1".to_string());
    store.guardar("2026-06", "a.pdf", b"a").expect("perfil 1");
    store.set_perfil("p_2".to_string());
    store.guardar("2026-06", "b.pdf", b"b").expect("perfil 2");

    assert_eq!(store.listar("2026-06").unwrap(), vec!["b.pdf".to_string()]);
    store.set_perfil("p_1".to_string());
    assert_eq!(store.listar("2026-06").unwrap(), vec!["a.pdf".to_string()]);
    cleanup(&dir);
}

#[test]
fn sin_perfil_configurado_las_operaciones_fallan_nombradas() {
    let dir = temp_dir("comp_sin_perfil");
    let mut store = ComprobantesFsRepository::new(dir.join("comprobantes"));

    let error = store
        .guardar("2026-06", "x.pdf", b"x")
        .expect_err("sin perfil debe fallar");
    assert!(
        error.motivo.contains("perfil"),
        "el motivo debe nombrar al perfil: {}",
        error.motivo
    );
    cleanup(&dir);
}
