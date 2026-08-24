//! Tests REQ-14-01 del motor PyG: 12 meses, variaciones % mensuales,
//! distinción histórico/proyectado y continuación plana con supuestos cero.

use super::pyg_proyeccion_fixtures::{
    registro, repo_con_snapshot, snapshot_con_registro, supuestos_con,
};
use crate::application::pyg_proyeccion::proyeccion_pyg;
use crate::application::pyg_proyeccion::SupuestosProyeccion;

#[test]
fn sin_registros_devuelve_serie_vacia_y_doce_proyectadas_a_cero() {
    let repo = repo_con_snapshot(snapshot_con_registro(vec![]));
    let resultado =
        proyeccion_pyg(&repo, &SupuestosProyeccion::default()).expect("proyección");
    assert!(resultado.filas_historicas.is_empty());
    assert_eq!(resultado.filas_proyectadas.len(), 12);
    for fila in &resultado.filas_proyectadas {
        assert_eq!(fila.ingresos, 0.0);
        assert_eq!(fila.gastos, 0.0);
        assert_eq!(fila.utilidad, 0.0);
    }
}

#[test]
fn proyeccion_12_meses_aplica_variacion_mensual_sobre_ingresos_y_gastos() {
    // Último mes real: salario 2000; vivienda 500 y alimentacion 300.
    let repo = repo_con_snapshot(snapshot_con_registro(vec![registro(
        "2026-06",
        &[("salario", 2000.0)],
        &[("vivienda", 500.0), ("alimentacion", 300.0)],
    )]));
    // Supuestos: +2 % salario, +1 % vivienda, +1.5 % alimentacion.
    let supuestos = supuestos_con(
        &[("salario", 0.02)],
        &[("vivienda", 0.01), ("alimentacion", 0.015)],
    );

    let proyeccion = proyeccion_pyg(&repo, &supuestos).expect("proyección");

    assert_eq!(proyeccion.filas_historicas.len(), 1);
    assert_eq!(proyeccion.filas_proyectadas.len(), 12);
    // Mes 1 (2026-07): 2000·1.02 = 2040; 500·1.01 + 300·1.015 = 809.5.
    let m1 = &proyeccion.filas_proyectadas[0];
    assert!((m1.ingresos - 2040.0).abs() < 0.01);
    assert!((m1.gastos - 809.5).abs() < 0.01);
    assert!((m1.utilidad - 1230.5).abs() < 0.01);
    // Mes 2: composición sobre el mes proyectado anterior.
    let m2 = &proyeccion.filas_proyectadas[1];
    assert!((m2.ingresos - 2080.8).abs() < 0.01);
}

#[test]
fn proyeccion_distingue_historico_de_proyectado() {
    let repo = repo_con_snapshot(snapshot_con_registro(vec![
        registro("2026-05", &[("salario", 1800.0)], &[("vivienda", 500.0)]),
        registro("2026-06", &[("salario", 2000.0)], &[("vivienda", 550.0)]),
    ]));
    let proyeccion =
        proyeccion_pyg(&repo, &SupuestosProyeccion::default()).expect("proyección");

    assert_eq!(proyeccion.filas_historicas.len(), 2);
    assert_eq!(proyeccion.filas_proyectadas.len(), 12);
    // Históricos mantienen valores reales en orden.
    assert_eq!(proyeccion.filas_historicas[0].mes, "2026-05");
    assert_eq!(proyeccion.filas_historicas[0].ingresos, 1800.0);
    assert_eq!(proyeccion.filas_historicas[1].mes, "2026-06");
    assert_eq!(proyeccion.filas_historicas[1].ingresos, 2000.0);
    // Proyectados empiezan el mes siguiente al último real.
    assert_eq!(proyeccion.filas_proyectadas[0].mes, "2026-07");
    assert_eq!(proyeccion.filas_proyectadas[11].mes, "2027-06");
}

#[test]
fn supuestos_cero_producen_continuacion_plana_desde_ultimo_mes_real() {
    let repo = repo_con_snapshot(snapshot_con_registro(vec![registro(
        "2026-06",
        &[("salario", 2000.0)],
        &[("vivienda", 500.0)],
    )]));
    let proyeccion =
        proyeccion_pyg(&repo, &SupuestosProyeccion::default()).expect("plana");

    for fila in &proyeccion.filas_proyectadas {
        assert!((fila.ingresos - 2000.0).abs() < 0.01);
        assert!((fila.gastos - 500.0).abs() < 0.01);
        assert!((fila.utilidad - 1500.0).abs() < 0.01);
    }
}
