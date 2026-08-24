//! Tipos del cierre mensual: resumen del wizard petición de cierre y
//! recomendaciones del assessment (los errores están en `errores`).

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::domain::catalogs::ExpenseCategory;

/// Severidad de una recomendación, heredada del semáforo.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severidad {
    Rojo,
    Amarillo,
    Verde,
}

/// Recomendación accionable en español producida por las reglas.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Recomendacion {
    /// Severidad del consejo (rojo = prioritario).
    pub severidad: Severidad,
    /// Título corto en español.
    pub titulo: String,
    /// Texto accionable con la acción concreta a tomar.
    pub texto: String,
}

/// Evolución mensual del flujo de caja para el paso Repaso.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct MesFlujo {
    /// Clave YYYY-MM.
    pub mes: String,
    /// Ingresos totales del mes.
    pub ingresos: f64,
    /// Gastos totales del mes.
    pub gastos: f64,
    /// Utilidad: ingresos menos gastos.
    pub utilidad: f64,
}

/// Patrimonio actual para el paso Repaso.
#[derive(Debug, Clone, PartialEq, Default, Serialize)]
pub struct PatrimonioActual {
    /// Suma de activos.
    pub activos: f64,
    /// Suma de pasivos.
    pub pasivos: f64,
    /// Patrimonio: activos menos pasivos.
    pub patrimonio: f64,
}

/// Resumen que alimenta los pasos del wizard (REQ-16-01/02).
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ResumenCierre {
    /// Mes que se cierra.
    pub mes: String,
    /// Evolución del flujo ordenada ascendente por mes.
    pub flujo: Vec<MesFlujo>,
    /// Patrimonio actual.
    pub patrimonio: PatrimonioActual,
    /// Presupuesto sugerido del mes siguiente (promedio móvil 3 meses).
    pub presupuesto_sugerido: BTreeMap<ExpenseCategory, f64>,
    /// ¿El mes ya está cerrado?
    pub cerrado: bool,
}
