//! REQ-32-01/02/04: tests del upsert/borrado de ACTIVOS sobre el snapshot
//! del perfil activo con persistencia real en directorio temporal.

use crate::application::balance_crud::{asset_eliminar, asset_upsert};
use crate::application::tests::balance_crud_fixtures::{limpiar, releer, repo_con_snapshot};
use crate::application::balance_crud_error::BalanceCrudError;

#[test]
fn asset_upsert_persiste_y_devuelve_el_snapshot_actualizado() {
    let (mut repo, base) = repo_con_snapshot("f32_asset_upsert");
    let snapshot =
        asset_upsert(&mut repo, "Fondo indexado", "inversion", 12500.0).expect("upsert válido");
    assert_eq!(snapshot.assets.len(), 1);
    assert_eq!(snapshot.assets[0].nombre(), "Fondo indexado");
    assert!((snapshot.assets[0].valor_actual() - 12500.0).abs() < 1e-9);
    // Round-trip: el cambio quedó persistido en el perfil activo.
    let releido = releer(&base);
    assert_eq!(releido.assets.len(), 1);
    assert!((releido.assets[0].valor_actual() - 12500.0).abs() < 1e-9);
    limpiar(&base);
}

#[test]
fn asset_upsert_edita_el_activo_existente_con_el_mismo_nombre() {
    let (mut repo, base) = repo_con_snapshot("f32_asset_edita");
    asset_upsert(&mut repo, "Cuenta", "liquido", 100.0).unwrap();
    let snapshot = asset_upsert(&mut repo, "Cuenta", "liquido", 250.0).unwrap();
    assert_eq!(snapshot.assets.len(), 1);
    assert!((snapshot.assets[0].valor_actual() - 250.0).abs() < 1e-9);
    limpiar(&base);
}

#[test]
fn asset_eliminar_borra_el_activo_del_snapshot_persistido() {
    let (mut repo, base) = repo_con_snapshot("f32_asset_eliminar");
    asset_upsert(&mut repo, "Coche", "propiedad", 9000.0).unwrap();
    let snapshot = asset_eliminar(&mut repo, "Coche").expect("borrado");
    assert!(snapshot.assets.is_empty());
    assert!(releer(&base).assets.is_empty());
    limpiar(&base);
}

#[test]
fn asset_con_valor_negativo_rechaza_sin_persistir_cambios() {
    let (mut repo, base) = repo_con_snapshot("f32_asset_negativo");
    let error = asset_upsert(&mut repo, "Deuda rara", "liquido", -1.0).unwrap_err();
    match error {
        BalanceCrudError::ValorNegativo(ref e) => {
            assert_eq!(e.entidad, "Asset");
            assert_eq!(e.campo, "valor_actual");
            assert!(error.to_string().contains("negativo"));
        }
        otro => panic!("error inesperado: {otro:?}"),
    }
    // Sin persistir: el snapshot vigente no cambia.
    assert!(releer(&base).assets.is_empty());
    limpiar(&base);
}

#[test]
fn categoria_desconocida_rechaza_sin_persistir_cambios() {
    let (mut repo, base) = repo_con_snapshot("f32_categoria_mala");
    let error = asset_upsert(&mut repo, "Raro", "criptomoneda", 10.0).unwrap_err();
    assert!(matches!(error, BalanceCrudError::CategoriaInvalida { .. }));
    assert!(error.to_string().contains("categoría"));
    assert!(releer(&base).assets.is_empty());
    limpiar(&base);
}
