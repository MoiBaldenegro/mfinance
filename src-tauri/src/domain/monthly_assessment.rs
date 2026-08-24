//! REQ-16-03/08: assessment persistido del cierre mensual: fecha, foto de
//! los indicadores del semáforo y decisiones (presupuesto del mes siguiente).
//! Consultable desde el snapshot para revisar cierres de meses anteriores.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::domain::catalogs::ExpenseCategory;
use crate::domain::month_key::MonthKey;

/// Foto de un indicador en el momento del cierre.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct IndicadorCerrado {
    /// Nombre del indicador (p. ej. "Endeudamiento").
    pub nombre: String,
    /// Valor calculado; `None` cuando faltaba dato para calcularlo.
    pub valor: Option<f64>,
    /// Clasificación del semáforo: verde amarillo rojo o sin_datos.
    pub clasificacion: String,
}

/// Registro inmutable del cierre de un mes (REQ-16-03).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MonthlyAssessment {
    mes: MonthKey,
    fecha_cierre: String,
    indicadores: Vec<IndicadorCerrado>,
    presupuesto_siguiente: BTreeMap<ExpenseCategory, f64>,
}

impl MonthlyAssessment {
    /// Construye el assessment del mes cerrado con sus decisiones.
    pub fn nuevo(
        mes: MonthKey,
        fecha_cierre: &str,
        indicadores: Vec<IndicadorCerrado>,
        presupuesto_siguiente: BTreeMap<ExpenseCategory, f64>,
    ) -> Self {
        Self {
            mes,
            fecha_cierre: fecha_cierre.to_string(),
            indicadores,
            presupuesto_siguiente,
        }
    }

    /// Mes que quedó cerrado.
    pub fn mes(&self) -> &MonthKey {
        &self.mes
    }

    /// Fecha del cierre en formato ISO YYYY-MM-DD.
    pub fn fecha_cierre(&self) -> &str {
        &self.fecha_cierre
    }

    /// Indicadores congelados al cierre.
    pub fn indicadores(&self) -> &[IndicadorCerrado] {
        &self.indicadores
    }

    /// Presupuesto decidido para el mes siguiente, por categoría.
    pub fn presupuesto_siguiente(&self) -> &BTreeMap<ExpenseCategory, f64> {
        &self.presupuesto_siguiente
    }
}
