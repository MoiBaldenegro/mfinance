//! Errores nombrados de las operaciones del cierre mensual (REQ-16):
//! cada variante es trazable hasta un código IPC estable.

use crate::domain::repository_errors::{SnapshotLoadError, SnapshotSaveError};

/// Errores nombrados de las operaciones de cierre.
#[derive(Debug, Clone, PartialEq)]
pub enum ErrorCierre {
    /// Fallo al cargar el snapshot vigente.
    Carga(SnapshotLoadError),
    /// Fallo al persistir el snapshot actualizado.
    Guardado(SnapshotSaveError),
    /// El mes ya está cerrado: no se puede cerrar dos veces.
    MesYaCerrado(String),
    /// El mes no está cerrado: no se puede reabrir.
    MesNoCerrado(String),
    /// Clave de mes mal formada (se espera YYYY-MM).
    MesInvalido(String),
}

impl std::fmt::Display for ErrorCierre {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ErrorCierre::Carga(e) => write!(f, "{e}"),
            ErrorCierre::Guardado(e) => write!(f, "{e}"),
            ErrorCierre::MesYaCerrado(mes) => {
                write!(f, "el mes {mes} ya está cerrado")
            }
            ErrorCierre::MesNoCerrado(mes) => {
                write!(f, "el mes {mes} no está cerrado")
            }
            ErrorCierre::MesInvalido(mes) => {
                write!(f, "clave de mes inválida (se espera YYYY-MM): \"{mes}\"")
            }
        }
    }
}

impl std::error::Error for ErrorCierre {}
