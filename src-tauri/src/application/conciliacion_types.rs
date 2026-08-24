//! REQ-13-01..07: tipos y errores del caso de uso de conciliación.

use crate::domain::account_statement::Movement;
use crate::domain::repository_errors::{SnapshotLoadError, SnapshotSaveError};
use std::fmt;

/// Errores nombrados del caso de uso de conciliación.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConciliacionError {
    SinDatos,
    CuentaNoEncontrada(String),
    MovimientoInvalido(String),
    Carga(String),
    Guardado(String),
}

impl fmt::Display for ConciliacionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConciliacionError::SinDatos => write!(f, "no hay datos guardados"),
            ConciliacionError::CuentaNoEncontrada(c) => write!(f, "cuenta no encontrada: {}", c),
            ConciliacionError::MovimientoInvalido(msg) => write!(f, "movimiento inválido: {}", msg),
            ConciliacionError::Carga(msg) => write!(f, "error de carga: {}", msg),
            ConciliacionError::Guardado(msg) => write!(f, "error de guardado: {}", msg),
        }
    }
}

impl std::error::Error for ConciliacionError {}

impl From<SnapshotLoadError> for ConciliacionError {
    fn from(e: SnapshotLoadError) -> Self {
        ConciliacionError::Carga(e.to_string())
    }
}

impl From<SnapshotSaveError> for ConciliacionError {
    fn from(e: SnapshotSaveError) -> Self {
        ConciliacionError::Guardado(e.to_string())
    }
}

/// Cuenta con su estado de conciliación calculado.
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub struct CuentaConciliada {
    pub cuenta: String,
    pub saldo_inicial: f64,
    pub movimientos: Vec<Movement>,
    pub saldo_final: f64,
    pub saldo_teorico: f64,
    pub diferencia: f64,
    pub conciliada: bool,
}

/// Resultado de la conciliación de un mes.
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub struct ConciliacionMensual {
    pub mes: String,
    pub cuentas: Vec<CuentaConciliada>,
    pub todas_conciliadas: bool,
}

/// Histórico de conciliación por mes.
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub struct HistoricoConciliacion {
    pub meses: Vec<String>,
    pub por_mes_data: std::collections::HashMap<String, ConciliacionMensual>,
}