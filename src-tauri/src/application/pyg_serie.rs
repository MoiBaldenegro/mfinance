//! REQ-07-01/07: caso de uso que calcula la serie mensual ordenada de
//! ingresos, gastos, utilidad y ahorro acumulado a partir de los
//! MonthlyRecord cargados vía el puerto SnapshotRepository. Puro: sin fs
//! ni framework de escritorio; el command fino lo expone por IPC.

use serde::Serialize;

use crate::domain::monthly_record::MonthlyRecord;
use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotLoadError;
use crate::domain::snapshot::FinanceSnapshot;

/// Fila P&G de un mes; claves snake_case para el cable IPC.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct FilaPyg {
    /// Mes de la fila (YYYY-MM).
    pub mes: String,
    /// Suma de ingresos del mes.
    pub ingresos: f64,
    /// Suma de gastos del mes.
    pub gastos: f64,
    /// Utilidad del mes: ingresos menos gastos (REQ-07-07).
    pub utilidad: f64,
    /// Ahorro acumulado: suma corrida de utilidades desde el primero.
    pub ahorro_acumulado: f64,
}

/// Serie mensual completa ordenada por mes ascendente.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct SeriePyg {
    /// Filas ordenadas; vacía si no hay ningún registro.
    pub filas: Vec<FilaPyg>,
}

fn fila_de(registro: &MonthlyRecord, acumulado_previo: f64) -> FilaPyg {
    let ingresos = registro.total_income();
    let gastos = registro.total_expense();
    let utilidad = ingresos - gastos;
    FilaPyg {
        mes: registro.mes().as_str().to_string(),
        ingresos,
        gastos,
        utilidad,
        ahorro_acumulado: acumulado_previo + utilidad,
    }
}

/// Motor puro del P&G: serie ordenada sobre un snapshot cualquiera.
/// Reutilizable por la proyección futura (feature 14).
pub fn calcular_serie(snapshot: &FinanceSnapshot) -> SeriePyg {
    let mut ordenados = snapshot.monthly_records.clone();
    ordenados.sort_by(|a, b| a.mes().cmp(b.mes()));
    let mut acumulado = 0.0;
    let filas = ordenados
        .iter()
        .map(|registro| {
            let fila = fila_de(registro, acumulado);
            acumulado = fila.ahorro_acumulado;
            fila
        })
        .collect();
    SeriePyg { filas }
}

/// Calcula la serie del estado vigente delegando la carga en el puerto.
pub fn pyg_serie(
    repository: &dyn SnapshotRepository,
) -> Result<SeriePyg, SnapshotLoadError> {
    Ok(calcular_serie(&repository.load()?))
}
