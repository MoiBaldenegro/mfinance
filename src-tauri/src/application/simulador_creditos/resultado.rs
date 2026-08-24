//! Tipos de resultado del simulador: resultado de un crédito, comparación
//! base vs optimizado y plan estratégico multi-crédito.

use crate::application::simulador_creditos::types::FilaAmortizacion;
use crate::domain::snapshot::DebtStrategy;
use serde::Serialize;

/// Resultado completo de amortizar un crédito.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ResultadoCredito {
    /// Cuota mensual del sistema francés (última cuota puede ser menor).
    pub cuota_mensual: f64,
    /// Meses hasta liquidar el crédito.
    pub meses: u32,
    /// Total de intereses pagados.
    pub intereses_totales: f64,
    /// Total pagado (capital + intereses).
    pub total_pagado: f64,
    /// Tabla de amortización mes a mes.
    pub tabla: Vec<FilaAmortizacion>,
}

/// Comparación del escenario base contra el optimizado con extras.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct SimulacionComparada {
    /// Escenario sin extras.
    pub base: ResultadoCredito,
    /// Escenario con extra mensual y extraordinarios.
    pub optimizado: ResultadoCredito,
    /// Meses que se ahorra el escenario optimizado.
    pub meses_ahorrados: u32,
    /// Intereses en euros que se ahorra el escenario optimizado.
    pub intereses_ahorrados: f64,
}

/// Resultado de aplicar una estrategia del plan de deuda sobre varios
/// créditos simulados (REQ-15-03): orden de ataque e intereses por escenario.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct EscenarioEstrategia {
    /// Estrategia aplicada (avalancha o bola de nieve).
    pub estrategia: DebtStrategy,
    /// Orden de ataque de los créditos según la estrategia.
    pub orden_de_ataque: Vec<String>,
    /// Crédito a atacar primero (el primero del orden).
    pub deuda_objetivo: Option<String>,
    /// Meses hasta liquidar todo sin extra.
    pub meses_base: u32,
    /// Intereses totales del escenario sin extra.
    pub intereses_base: f64,
    /// Meses hasta liquidar todo con el extra mensual.
    pub meses_optimizado: u32,
    /// Intereses totales del escenario con extra.
    pub intereses_optimizado: f64,
    /// Meses ahorrados por el extra.
    pub meses_ahorrados: u32,
    /// Intereses ahorrados por el extra.
    pub intereses_ahorrados: f64,
}

/// Plan estratégico completo sobre varios créditos simulados: un
/// escenario por estrategia soportada.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct PlanCreditosSimulados {
    /// Un escenario por estrategia ([avalancha, bola de nieve]).
    pub escenarios: Vec<EscenarioEstrategia>,
}
