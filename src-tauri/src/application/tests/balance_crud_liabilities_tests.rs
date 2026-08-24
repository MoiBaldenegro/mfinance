//! REQ-32-02/03/04: tests del upsert/borrado de PASIVOS sobre el snapshot
//! del perfil activo con persistencia real en directorio temporal.

use crate::application::balance_crud::{liability_eliminar, liability_upsert};
use crate::application::balance_crud_error::BalanceCrudError;
use crate::application::tests::balance_crud_fixtures::{limpiar, releer, repo_con_snapshot};

#[test]
fn liability_upsert_persiste_saldo_y_tasa_y_devuelve_el_snapshot() {
    let (mut repo, base) = repo_con_snapshot("f32_liab_upsert");
    let snapshot =
        liability_upsert(&mut repo, "Hipoteca", 85000.0, 3.15).expect("upsert válido");
    assert_eq!(snapshot.liabilities.len(), 1);
    assert!((snapshot.liabilities[0].saldo_pendiente() - 85000.0).abs() < 1e-9);
    assert!((snapshot.liabilities[0].tasa_interes_anual() - 3.15).abs() < 1e-9);
    let releido = releer(&base);
    assert_eq!(releido.liabilities.len(), 1);
    limpiar(&base);
}

#[test]
fn liability_eliminar_borra_el_pasivo_del_snapshot_persistido() {
    let (mut repo, base) = repo_con_snapshot("f32_liab_eliminar");
    liability_upsert(&mut repo, "Tarjeta", 500.0, 18.0).unwrap();
    let snapshot = liability_eliminar(&mut repo, "Tarjeta").expect("borrado");
    assert!(snapshot.liabilities.is_empty());
    assert!(releer(&base).liabilities.is_empty());
    limpiar(&base);
}

#[test]
fn pasivo_con_saldo_o_tasa_negativos_rechaza_sin_persistir_cambios() {
    let (mut repo, base) = repo_con_snapshot("f32_liab_negativo");
    for caso in [(-10.0, 18.0), (500.0, -0.5)] {
        let error = liability_upsert(&mut repo, "Préstamo", caso.0, caso.1).unwrap_err();
        match error {
            BalanceCrudError::ValorNegativo(ref e) => {
                assert_eq!(e.entidad, "Liability");
                assert!(error.to_string().contains("negativo"));
            }
            otro => panic!("error inesperado: {otro:?}"),
        }
    }
    // Ninguno de los dos intentos persistó cambios.
    assert!(releer(&base).liabilities.is_empty());
    limpiar(&base);
}
