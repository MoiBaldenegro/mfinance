//! Test REQ-21-02/03 del aislamiento: dos perfiles creados por los casos
//! de uso, alternando el activo; cada uno carga y guarda SU snapshot en
//! su propia carpeta sin cruzar datos. Directorio temporal, nunca
//! Documents real.

use std::fs;

use super::test_support::{cleanup, temp_dir};
use crate::application::perfiles::{crear, seleccionar};
use crate::domain::repository::SnapshotRepository;
use crate::infrastructure::json_repository::JsonSnapshotRepository;
use crate::seed;

#[test]
fn dos_perfiles_alternan_el_activo_y_recuperan_su_snapshot() {
    let base = temp_dir("aislamiento");
    let mut store = JsonSnapshotRepository::new(base.clone());

    let ana = crear(&mut store, "Ana").expect("alta Ana");
    let beto = crear(&mut store, "Beto").expect("alta Beto");

    let mut snap_ana = seed::example_snapshot();
    snap_ana.strategy.extra_monthly_payment = 111.0;
    let mut snap_beto = seed::example_snapshot();
    snap_beto.strategy.extra_monthly_payment = 222.0;

    seleccionar(&mut store, &ana.id).expect("activar Ana");
    store.save(&snap_ana).expect("guardar snapshot de Ana");
    seleccionar(&mut store, &beto.id).expect("activar Beto");
    store.save(&snap_beto).expect("guardar snapshot de Beto");

    let ruta_ana = base
        .join("perfiles")
        .join(&ana.id)
        .join("mfinance.json");
    let ruta_beto = base
        .join("perfiles")
        .join(&beto.id)
        .join("mfinance.json");
    assert!(ruta_ana.is_file(), "Ana tiene su propio archivo");
    assert!(ruta_beto.is_file(), "Beto tiene su propio archivo");

    // Alternar el activo recupera SIEMPRE el snapshot de su titular.
    seleccionar(&mut store, &ana.id).unwrap();
    assert_eq!(store.load().unwrap(), snap_ana, "sin cruce hacia Beto");
    seleccionar(&mut store, &beto.id).unwrap();
    assert_eq!(store.load().unwrap(), snap_beto, "sin cruce hacia Ana");

    let extra = |ruta: &_| {
        let raw = fs::read_to_string(ruta).unwrap();
        serde_json::from_str::<serde_json::Value>(&raw).unwrap()
            ["strategy"]["extra_monthly_payment"]
            .as_f64()
            .unwrap()
    };
    assert_eq!(extra(&ruta_ana), 111.0);
    assert_eq!(extra(&ruta_beto), 222.0);
    cleanup(&base);
}
