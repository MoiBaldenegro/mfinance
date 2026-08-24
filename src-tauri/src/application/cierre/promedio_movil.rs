//! REQ-16-02: promedio móvil de los últimos tres meses registrados por
//! categoría de gasto, para pre-rellenar el presupuesto del mes siguiente.
//! Puro: sin repositorio ni reloj.

use std::collections::BTreeMap;

use crate::domain::catalogs::ExpenseCategory;
use crate::domain::monthly_record::MonthlyRecord;

/// Ventana fija del promedio móvil exigida por REQ-16-02.
pub const VENTANA_MESES: usize = 3;

/// Promedio móvil por categoría sobre los últimos `VENTANA_MESES` meses
/// registrados. Los meses sin dato para una categoría cuentan como cero y
/// con menos de tres meses el divisor es el número de meses disponibles.
pub fn promedio_movil_3(
    registros: &[MonthlyRecord],
) -> BTreeMap<ExpenseCategory, f64> {
    let mut recientes: Vec<&MonthlyRecord> = registros.iter().collect();
    // Orden canónico por clave de mes; da igual cómo viniera el vector.
    recientes.sort_by(|a, b| a.mes().as_str().cmp(b.mes().as_str()));
    let ventana: Vec<&MonthlyRecord> = recientes
        .into_iter()
        .rev()
        .take(VENTANA_MESES)
        .collect();
    if ventana.is_empty() {
        return BTreeMap::new();
    }
    let divisor = ventana.len() as f64;
    let mut sumas: BTreeMap<ExpenseCategory, f64> = BTreeMap::new();
    for registro in &ventana {
        for categoria in ExpenseCategory::ALL {
            let importe = registro.gasto(categoria).copied().unwrap_or(0.0);
            *sumas.entry(categoria).or_insert(0.0) += importe;
        }
    }
    sumas
        .into_iter()
        .map(|(categoria, suma)| (categoria, suma / divisor))
        .collect()
}
