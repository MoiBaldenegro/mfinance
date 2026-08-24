//! Tests del promedio móvil de 3 meses por categoría (REQ-16-02):
//! presupuesto del mes siguiente pre-relleno con el promedio de los
//! últimos tres meses registrados.

use std::collections::BTreeMap;

use crate::application::cierre::fecha::fecha_iso_desde_epoch;
use crate::application::cierre::promedio_movil::promedio_movil_3;
use crate::domain::catalogs::ExpenseCategory;
use crate::domain::monthly_record::MonthlyRecord;

fn registro(mes: &str, gastos: &[(&str, f64)]) -> MonthlyRecord {
    MonthlyRecord::from_raw(mes, &[], gastos).expect("registro válido")
}

fn gasto(mapa: &BTreeMap<ExpenseCategory, f64>, categoria: ExpenseCategory) -> f64 {
    *mapa.get(&categoria).unwrap_or(&0.0)
}

#[test]
fn promedia_los_ultimos_tres_meses_por_categoria() {
    let registros = vec![
        registro("2026-05", &[("vivienda", 900.0), ("ocio", 100.0)]),
        registro("2026-06", &[("vivienda", 1000.0), ("ocio", 200.0)]),
        registro("2026-07", &[("vivienda", 1100.0), ("ocio", 300.0)]),
    ];
    let sugerido = promedio_movil_3(&registros);
    assert!((gasto(&sugerido, ExpenseCategory::Vivienda) - 1000.0).abs() < 1e-9);
    assert!((gasto(&sugerido, ExpenseCategory::Ocio) - 200.0).abs() < 1e-9);
    // Categoría ausente en los tres meses: objetivo cero.
    assert_eq!(gasto(&sugerido, ExpenseCategory::Transporte), 0.0);
}

#[test]
fn con_menos_de_tres_meses_promedia_los_disponibles() {
    let registros = vec![
        registro("2026-06", &[("vivienda", 1200.0)]),
        registro("2026-07", &[("alimentacion", 400.0)]),
    ];
    let sugerido = promedio_movil_3(&registros);
    assert!((gasto(&sugerido, ExpenseCategory::Vivienda) - 600.0).abs() < 1e-9);
    assert!((gasto(&sugerido, ExpenseCategory::Alimentacion) - 200.0).abs() < 1e-9);
}

#[test]
fn sin_registros_devuelve_objetivos_vacios() {
    assert!(promedio_movil_3(&[]).is_empty());
}

#[test]
fn usa_solo_los_ultimos_tres_aunque_haya_mas() {
    let registros = vec![
        registro("2026-03", &[("vivienda", 5000.0)]),
        registro("2026-04", &[("vivienda", 5000.0)]),
        registro("2026-05", &[("vivienda", 900.0)]),
        registro("2026-06", &[("vivienda", 1000.0)]),
        registro("2026-07", &[("vivienda", 1100.0)]),
    ];
    let sugerido = promedio_movil_3(&registros);
    assert!((gasto(&sugerido, ExpenseCategory::Vivienda) - 1000.0).abs() < 1e-9);
}

#[test]
fn la_fecha_del_cierre_se_deriva_de_la_epoca_con_bisiestos() {
    assert_eq!(fecha_iso_desde_epoch(0), "1970-01-01");
    assert_eq!(fecha_iso_desde_epoch(365), "1971-01-01");
    assert_eq!(fecha_iso_desde_epoch(789), "1972-02-29");
    assert_eq!(fecha_iso_desde_epoch(20670), "2026-08-05");
}
