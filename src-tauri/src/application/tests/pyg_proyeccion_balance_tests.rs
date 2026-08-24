//! Tests REQ-14-02 (1/2): amortización de pasivos según los pagos actuales
//! (cuotas_deuda del último registro mensual), caso canónico y cuota real.

use super::pyg_proyeccion_fixtures::{
    asset, liability, registro, repo_con_snapshot, snapshot_completo,
};
use crate::application::pyg_proyeccion::balance_futuro;
use crate::application::pyg_proyeccion::SupuestosProyeccion;

#[test]
fn balance_amortiza_segun_cuota_registrada_caso_canonico() {
    // Saldo 6000 con cuotas_deuda 100/mes y tasa 0 % → 100/mes lineales:
    // 5900 tras el mes 1 y 4800 tras el mes 12 (caso del review).
    let snapshot = snapshot_completo(
        vec![registro(
            "2026-06",
            &[("salario", 2000.0)],
            &[("vivienda", 500.0), ("cuotas_deuda", 100.0)],
        )],
        vec![asset("Efectivo", 10000.0)],
        vec![liability("Préstamo", 6000.0, 0.0)],
    );
    let balance =
        balance_futuro(&repo_con_snapshot(snapshot), &SupuestosProyeccion::default())
            .expect("balance futuro");

    assert_eq!(balance.filas_proyectadas.len(), 12);
    assert!((balance.filas_proyectadas[0].pasivos - 5900.0).abs() < 0.01);
    assert!((balance.filas_proyectadas[11].pasivos - 4800.0).abs() < 0.01);
}

#[test]
fn balance_usa_la_cuota_real_y_no_un_horizonte_fijo() {
    // Cuota registrada 250/mes sobre saldo 6000 → amortiza 250/mes
    // (5750 tras el mes 1; 3000 tras el mes 12) y decrece siempre.
    let snapshot = snapshot_completo(
        vec![registro(
            "2026-06",
            &[("salario", 2000.0)],
            &[("vivienda", 500.0), ("cuotas_deuda", 250.0)],
        )],
        vec![asset("Efectivo", 10000.0)],
        vec![liability("Préstamo", 6000.0, 0.0)],
    );
    let balance =
        balance_futuro(&repo_con_snapshot(snapshot), &SupuestosProyeccion::default())
            .expect("balance futuro");

    assert!((balance.filas_proyectadas[0].pasivos - 5750.0).abs() < 0.01);
    assert!((balance.filas_proyectadas[11].pasivos - 3000.0).abs() < 0.01);
    let mut previo = 6000.0;
    for fila in &balance.filas_proyectadas {
        assert!(fila.pasivos < previo, "pasivos deben decrecer mes a mes");
        previo = fila.pasivos;
    }
}
