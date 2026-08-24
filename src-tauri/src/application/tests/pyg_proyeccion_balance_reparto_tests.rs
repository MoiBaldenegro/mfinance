//! Tests REQ-14-02 (2/2): reparto de la cuota entre pasivos e interés
//! prioritario; consistencia patrimonio = activos − pasivos.

use super::pyg_proyeccion_fixtures::{
    asset, liability, registro, repo_con_snapshot, snapshot_completo,
};
use crate::application::pyg_proyeccion::balance_futuro;
use crate::application::pyg_proyeccion::SupuestosProyeccion;

#[test]
fn balance_reparte_la_cuota_proporcional_al_saldo() {
    // L1=4000 y L2=2000 con cuota total 150 → 100 y 50: 5850 tras el mes 1.
    // Patrimonio consistente (= activos − pasivos) en varios meses.
    let snapshot = snapshot_completo(
        vec![registro(
            "2026-06",
            &[("salario", 2000.0)],
            &[("vivienda", 500.0), ("cuotas_deuda", 150.0)],
        )],
        vec![asset("Efectivo", 12000.0)],
        vec![
            liability("Préstamo coche", 4000.0, 0.0),
            liability("Préstamo personal", 2000.0, 0.0),
        ],
    );
    let balance =
        balance_futuro(&repo_con_snapshot(snapshot), &SupuestosProyeccion::default())
            .expect("balance futuro");

    assert_eq!(balance.filas_historicas.len(), 1);
    assert!((balance.filas_historicas[0].patrimonio - 6000.0).abs() < 0.01);
    assert!((balance.filas_proyectadas[0].pasivos - 5850.0).abs() < 0.01);
    for indice in [0usize, 5, 11] {
        let fila = &balance.filas_proyectadas[indice];
        assert!(
            (fila.patrimonio - (fila.activos - fila.pasivos)).abs() < 0.01,
            "patrimonio inconsistente en mes {}",
            indice + 1
        );
    }
}

#[test]
fn balance_cubre_primero_intereses_y_no_amortiza_si_no_alcanza() {
    // Pasivo 12000 al 12 % anual → interés mensual 120 > cuota 100:
    // la cuota no alcanza para intereses, no se amortiza principal.
    let snapshot = snapshot_completo(
        vec![registro(
            "2026-06",
            &[("salario", 2000.0)],
            &[("vivienda", 500.0), ("cuotas_deuda", 100.0)],
        )],
        vec![asset("Efectivo", 20000.0)],
        vec![liability("Hipoteca", 12000.0, 12.0)],
    );
    let balance =
        balance_futuro(&repo_con_snapshot(snapshot), &SupuestosProyeccion::default())
            .expect("balance futuro");

    for fila in &balance.filas_proyectadas {
        assert!(
            (fila.pasivos - 12000.0).abs() < 0.01,
            "sin cuota suficiente no debe amortizar principal"
        );
    }
}
