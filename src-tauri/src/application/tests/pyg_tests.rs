//! Tests REQ-07-01/07 de pyg_serie: serie mensual ordenada con utilidad
//! y ahorro acumulado (suma corrida), calculada desde el puerto.

use super::memory_repository::MemoryRepository;
use crate::application::pyg_serie::pyg_serie;
use crate::domain::monthly_record::MonthlyRecord;
use crate::domain::snapshot::FinanceSnapshot;

fn registro(
    mes: &str,
    ingresos: &[(&str, f64)],
    gastos: &[(&str, f64)],
) -> MonthlyRecord {
    MonthlyRecord::from_raw(mes, ingresos, gastos).expect("registro válido")
}

fn repo_con(registros: Vec<MonthlyRecord>) -> MemoryRepository {
    let mut repo = MemoryRepository::default();
    let mut snapshot = FinanceSnapshot::new();
    snapshot.monthly_records = registros;
    repo.stored = Some(snapshot);
    repo
}

#[test]
fn sin_registros_devuelve_serie_vacia() {
    let serie = pyg_serie(&repo_con(vec![])).expect("serie sobre vacío");
    assert!(serie.filas.is_empty());
}

#[test]
fn la_serie_queda_ordenada_aunque_el_snapshot_venga_desordenado() {
    let repo = repo_con(vec![
        registro("2026-03", &[("salario", 2000.0)], &[("vivienda", 500.0)]),
        registro("2026-01", &[("salario", 1000.0)], &[("vivienda", 400.0)]),
        registro("2026-02", &[("salario", 1500.0)], &[("vivienda", 300.0)]),
    ]);
    let serie = pyg_serie(&repo).expect("serie ordenada");
    let meses: Vec<&str> =
        serie.filas.iter().map(|f| f.mes.as_str()).collect();
    assert_eq!(meses, vec!["2026-01", "2026-02", "2026-03"]);
}

#[test]
fn la_utilidad_es_ingresos_menos_gastos_en_cada_mes() {
    let repo = repo_con(vec![registro(
        "2026-05",
        &[("salario", 2500.0), ("freelance", 300.0)],
        &[("vivienda", 980.0), ("ocio", 150.0)],
    )]);
    let fila = &pyg_serie(&repo).expect("serie").filas[0];
    assert_eq!(fila.utilidad, 2500.0 + 300.0 - 980.0 - 150.0);
}

#[test]
fn el_ahorro_acumulado_es_suma_corrida_desde_el_primer_mes() {
    let repo = repo_con(vec![
        registro("2026-01", &[("salario", 1000.0)], &[("vivienda", 400.0)]),
        registro("2026-02", &[("salario", 1200.0)], &[("vivienda", 900.0)]),
        registro("2026-03", &[("salario", 1100.0)], &[("vivienda", 300.0)]),
    ]);
    let acumulados: Vec<f64> = pyg_serie(&repo)
        .expect("serie")
        .filas
        .iter()
        .map(|f| f.ahorro_acumulado)
        .collect();
    assert_eq!(acumulados, vec![600.0, 900.0, 1700.0]);
}

#[test]
fn un_mes_intermedio_faltante_no_se_rellena_y_el_acumulado_cruza_el_hueco() {
    let repo = repo_con(vec![
        registro("2026-09", &[("salario", 2000.0)], &[("vivienda", 1500.0)]),
        registro("2026-11", &[("salario", 2000.0)], &[("vivienda", 1000.0)]),
    ]);
    let serie = pyg_serie(&repo).expect("serie con hueco");
    let meses: Vec<&str> =
        serie.filas.iter().map(|f| f.mes.as_str()).collect();
    assert_eq!(meses, vec!["2026-09", "2026-11"]);
    assert_eq!(serie.filas[1].ahorro_acumulado, 1500.0);
}
