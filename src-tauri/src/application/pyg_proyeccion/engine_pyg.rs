//! REQ-14-01: motor puro de la proyección PyG a 12 meses aplicando
//! supuestos de variación % mensual sobre ingresos y cada categoría de
//! gasto, partiendo del último mes histórico real. Sin fs ni framework de escritorio.

use std::collections::BTreeMap;

use super::types::{mes_siguiente, FilaProyeccionPyg, ProyeccionPyg, SupuestosProyeccion};
use crate::domain::catalogs::{ExpenseCategory, IncomeSource};
use crate::domain::snapshot::FinanceSnapshot;

const MESES_PROYECTADOS: usize = 12;

/// Total del mes de un lado del PyG y avance compuesto de sus valores base.
fn aplicar_variacion<K>(
    mapa: &mut BTreeMap<K, f64>,
    variaciones: &BTreeMap<String, f64>,
    clave_de: impl Fn(&K) -> &str,
) -> f64 {
    let mut total = 0.0;
    for (clave, valor) in mapa.iter_mut() {
        let factor = 1.0 + variaciones.get(clave_de(clave)).copied().unwrap_or(0.0);
        total += *valor * factor;
        *valor *= factor;
    }
    total
}

/// Filas históricas reales ordenadas asc con el ahorro acumulado corrido.
fn filas_historicas(snapshot: &FinanceSnapshot) -> (Vec<FilaProyeccionPyg>, f64) {
    let mut registros = snapshot.monthly_records.clone();
    registros.sort_by(|a, b| a.mes().cmp(b.mes()));
    let mut filas = Vec::new();
    let mut acumulado = 0.0;
    for registro in &registros {
        let utilidad = registro.total_income() - registro.total_expense();
        acumulado += utilidad;
        filas.push(FilaProyeccionPyg {
            mes: registro.mes().as_str().to_string(),
            ingresos: registro.total_income(),
            gastos: registro.total_expense(),
            utilidad,
            ahorro_acumulado: acumulado,
        });
    }
    (filas, acumulado)
}

/// Motor puro: proyección de 12 meses desde el último mes real (o ceros).
pub fn calcular_proyeccion_pyg(
    snapshot: &FinanceSnapshot,
    supuestos: &SupuestosProyeccion,
) -> ProyeccionPyg {
    let (filas_historicas, mut acumulado) = filas_historicas(snapshot);
    let ultimo =
        snapshot.monthly_records.iter().max_by(|a, b| a.mes().cmp(b.mes()));
    let mut mes_actual = match ultimo {
        Some(registro) => mes_siguiente(registro.mes().as_str()),
        None => "2026-01".to_string(),
    };
    let mut ingresos_base = ultimo.map(|r| r.ingresos().clone()).unwrap_or_default();
    let mut gastos_base = ultimo.map(|r| r.gastos().clone()).unwrap_or_default();

    let mut filas_proyectadas = Vec::with_capacity(MESES_PROYECTADOS);
    for _ in 0..MESES_PROYECTADOS {
        let ingresos = aplicar_variacion(
            &mut ingresos_base,
            &supuestos.variacion_ingresos,
            |k: &IncomeSource| k.as_str(),
        );
        let gastos = aplicar_variacion(
            &mut gastos_base,
            &supuestos.variacion_gastos,
            |k: &ExpenseCategory| k.as_str(),
        );
        acumulado += ingresos - gastos;
        filas_proyectadas.push(FilaProyeccionPyg {
            mes: mes_actual.clone(),
            ingresos,
            gastos,
            utilidad: ingresos - gastos,
            ahorro_acumulado: acumulado,
        });
        mes_actual = mes_siguiente(&mes_actual);
    }

    ProyeccionPyg { filas_historicas, filas_proyectadas }
}
