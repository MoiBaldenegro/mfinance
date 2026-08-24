//! Tests REQ-14-01 de supuestos: multi-fuente/multi-categoría, orden
//! ascendente de meses y variaciones negativas compuestas.

use super::pyg_proyeccion_fixtures::{
    registro, repo_con_snapshot, snapshot_con_registro, supuestos_con,
};
use crate::application::pyg_proyeccion::proyeccion_pyg;
use crate::application::pyg_proyeccion::SupuestosProyeccion;

#[test]
fn proyeccion_con_varias_fuentes_ingreso_y_categorias_gasto() {
    let repo = repo_con_snapshot(snapshot_con_registro(vec![registro(
        "2026-06",
        &[("salario", 2000.0), ("freelance", 500.0), ("arriendos", 300.0)],
        &[
            ("vivienda", 600.0),
            ("alimentacion", 400.0),
            ("transporte", 150.0),
            ("ocio", 100.0),
        ],
    )]));
    let supuestos = supuestos_con(
        &[("salario", 0.01), ("freelance", 0.03), ("arriendos", 0.0)],
        &[
            ("vivienda", 0.02),
            ("alimentacion", 0.01),
            ("transporte", 0.0),
            ("ocio", -0.05),
        ],
    );

    let proyeccion = proyeccion_pyg(&repo, &supuestos).expect("multi-fuente");

    assert_eq!(proyeccion.filas_proyectadas.len(), 12);
    // Mes 1: 2020 + 515 + 300 = 2835 de ingresos.
    let m1 = &proyeccion.filas_proyectadas[0];
    assert!((m1.ingresos - 2835.0).abs() < 0.01);
    // Gastos: 612 + 404 + 150 + 95 = 1261.
    assert!((m1.gastos - 1261.0).abs() < 0.01);
}

#[test]
fn proyeccion_ordena_meses_ascendente_incluyendo_proyectados() {
    let repo = repo_con_snapshot(snapshot_con_registro(vec![
        registro("2026-03", &[("salario", 1000.0)], &[("vivienda", 300.0)]),
        registro("2026-01", &[("salario", 1000.0)], &[("vivienda", 300.0)]),
        registro("2026-02", &[("salario", 1000.0)], &[("vivienda", 300.0)]),
    ]));
    let proyeccion =
        proyeccion_pyg(&repo, &SupuestosProyeccion::default()).expect("ordenada");

    let meses_hist: Vec<&str> =
        proyeccion.filas_historicas.iter().map(|f| f.mes.as_str()).collect();
    assert_eq!(meses_hist, vec!["2026-01", "2026-02", "2026-03"]);

    let meses_proj: Vec<&str> =
        proyeccion.filas_proyectadas.iter().map(|f| f.mes.as_str()).collect();
    assert_eq!(meses_proj[0], "2026-04");
    assert_eq!(meses_proj[11], "2027-03");
}

#[test]
fn variacion_negativa_reduce_valor_proyectado() {
    let repo = repo_con_snapshot(snapshot_con_registro(vec![registro(
        "2026-06",
        &[("salario", 2000.0)],
        &[("vivienda", 500.0)],
    )]));
    let supuestos = supuestos_con(&[("salario", -0.02)], &[]);

    let proyeccion = proyeccion_pyg(&repo, &supuestos).expect("con caída");

    // Composición negativa: 2000·0.98 = 1960; 1960·0.98 = 1920.8.
    assert!((proyeccion.filas_proyectadas[0].ingresos - 1960.0).abs() < 0.01);
    assert!((proyeccion.filas_proyectadas[1].ingresos - 1920.8).abs() < 0.01);
}
