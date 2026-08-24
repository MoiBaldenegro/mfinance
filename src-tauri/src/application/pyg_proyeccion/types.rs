//! REQ-14-01/02: tipos del cable serde de la proyección y utilidad de
//! meses. Claves de supuestos canónicas (minúsculas sin tildes) igual
//! que IncomeSource::as_str / ExpenseCategory::as_str. Puro: sin framework de escritorio.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

/// Supuestos: variación % mensual por fuente de ingreso y categoría de gasto.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct SupuestosProyeccion {
    /// Variación mensual por fuente ("salario" → 0.02 = +2 %/mes).
    pub variacion_ingresos: BTreeMap<String, f64>,
    /// Variación mensual por categoría ("vivienda" → 0.01 = +1 %/mes).
    pub variacion_gastos: BTreeMap<String, f64>,
}

impl SupuestosProyeccion {
    /// Supuestos vacíos: continuación plana (0 % variación en todo).
    pub fn nuevo() -> Self {
        Self::default()
    }

    /// Fija la variación de una fuente de ingreso (encadenable).
    pub fn con_variacion_ingreso(mut self, clave: String, variacion: f64) -> Self {
        self.variacion_ingresos.insert(clave, variacion);
        self
    }

    /// Fija la variación de una categoría de gasto (encadenable).
    pub fn con_variacion_gasto(mut self, clave: String, variacion: f64) -> Self {
        self.variacion_gastos.insert(clave, variacion);
        self
    }
}

/// Fila de la proyección PyG (histórica o proyectada).
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct FilaProyeccionPyg {
    /// Mes (YYYY-MM).
    pub mes: String,
    /// Ingresos del mes.
    pub ingresos: f64,
    /// Gastos del mes.
    pub gastos: f64,
    /// Utilidad: ingresos − gastos.
    pub utilidad: f64,
    /// Ahorro acumulado desde el primer mes histórico.
    pub ahorro_acumulado: f64,
}

/// Proyección completa PyG: histórico real + 12 meses proyectados.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ProyeccionPyg {
    /// Histórico real ordenado asc (vacío sin registros).
    pub filas_historicas: Vec<FilaProyeccionPyg>,
    /// Los 12 meses siguientes al último histórico.
    pub filas_proyectadas: Vec<FilaProyeccionPyg>,
}

/// Fila del balance futuro (histórica o proyectada).
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct FilaBalanceFuturo {
    /// Mes (YYYY-MM; la fila histórica única usa "actual").
    pub mes: String,
    /// Total de activos del mes.
    pub activos: f64,
    /// Total de pasivos del mes.
    pub pasivos: f64,
    /// Patrimonio: activos − pasivos.
    pub patrimonio: f64,
}

/// Balance futuro completo: histórico real + 12 meses proyectados.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct BalanceFuturo {
    /// Totales vigentes como fila histórica (vacía sin activos ni pasivos).
    pub filas_historicas: Vec<FilaBalanceFuturo>,
    /// Los mismos 12 meses que la proyección PyG.
    pub filas_proyectadas: Vec<FilaBalanceFuturo>,
}

/// Mes siguiente en formato YYYY-MM (compartida por ambos motores).
pub(super) fn mes_siguiente(mes: &str) -> String {
    let partes: Vec<&str> = mes.split('-').collect();
    let anio: i32 = partes.first().and_then(|p| p.parse().ok()).unwrap_or(1970);
    let num: i32 = partes.get(1).and_then(|p| p.parse().ok()).unwrap_or(1);
    if num == 12 {
        format!("{:04}-{:02}", anio + 1, 1)
    } else {
        format!("{:04}-{:02}", anio, num + 1)
    }
}
