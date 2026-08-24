//! Confirmación de movimientos aceptados (REQ-12-12): incorporación al
//! MonthlyRecord del mes y persistencia del snapshot actualizado.

use std::collections::BTreeMap;

use super::tipos::{validar_mes, DiagnosticoError, MovimientoAceptado};
use crate::domain::month_key::MonthKey;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;

/// Incorpora los movimientos aceptados al MonthlyRecord del mes (suma el
/// valor absoluto como gasto de la categoría elegida) y persiste el
/// snapshot actualizado; devuelve el snapshot vigente.
pub fn confirmar_movimientos(
    repo: &mut dyn SnapshotRepository,
    mes: &str,
    aceptados: &[MovimientoAceptado],
) -> Result<FinanceSnapshot, DiagnosticoError> {
    let clave = validar_mes(mes)?;
    let mut snapshot = repo
        .load()
        .map_err(|e| DiagnosticoError::Snapshot(e.to_string()))?;
    let posicion = posicion_del_mes(&snapshot, &clave);
    let previo = posicion.map(|i| &snapshot.monthly_records[i]);
    let mut gastos: BTreeMap<_, _> =
        previo.map(|r| r.gastos().clone()).unwrap_or_default();
    for aceptado in aceptados {
        *gastos.entry(aceptado.categoria).or_insert(0.0)
            += aceptado.movimiento.importe.abs();
    }
    let registro = reconstruir_registro(previo, &clave, gastos);
    match posicion {
        Some(i) => snapshot.monthly_records[i] = registro,
        None => snapshot.monthly_records.push(registro),
    }
    repo.save(&snapshot)
        .map_err(|e| DiagnosticoError::Snapshot(e.to_string()))?;
    Ok(snapshot)
}

fn posicion_del_mes(
    snapshot: &FinanceSnapshot,
    clave: &MonthKey,
) -> Option<usize> {
    snapshot.monthly_records.iter().position(|r| r.mes() == clave)
}

/// Reconstruye el registro inmutablemente: modificar = nueva instancia.
fn reconstruir_registro(
    previo: Option<&crate::domain::monthly_record::MonthlyRecord>,
    clave: &MonthKey,
    gastos: BTreeMap<crate::domain::catalogs::ExpenseCategory, f64>,
) -> crate::domain::monthly_record::MonthlyRecord {
    use crate::domain::monthly_record::MonthlyRecord;
    match previo {
        Some(r) => MonthlyRecord::new(r.mes().clone(), r.ingresos().clone(), gastos),
        None => MonthlyRecord::new(clave.clone(), [], gastos),
    }
}
