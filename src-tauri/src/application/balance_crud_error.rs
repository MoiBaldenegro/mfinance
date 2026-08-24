//! REQ-32-04: errores nombrados del CRUD de balance (código IPC).

use std::error::Error;
use std::fmt;

use crate::domain::negative_value::NegativeValueError;
use crate::domain::repository_errors::{SnapshotLoadError, SnapshotSaveError};

/// Error nombrado del CRUD de activos/pasivos sobre el snapshot.
#[derive(Debug, Clone)]
pub enum BalanceCrudError {
    /// Valor negativo rechazado por el dominio (REQ-32-04).
    ValorNegativo(NegativeValueError),
    /// Categoría de activo no reconocida (REQ-32-04).
    CategoriaInvalida { valor: String },
    /// El snapshot vigente no pudo leerse.
    Carga(SnapshotLoadError),
    /// La persistencia falló (no se aplicó el cambio).
    Guardado(SnapshotSaveError),
}

impl fmt::Display for BalanceCrudError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ValorNegativo(e) => write!(f, "{e}"),
            Self::CategoriaInvalida { valor } => write!(
                f,
                "categoría de activo no válida: «{valor}» \
                 (válidas: liquido, inversion, propiedad)"
            ),
            Self::Carga(e) => write!(f, "{e}"),
            Self::Guardado(e) => write!(f, "{e}"),
        }
    }
}

impl Error for BalanceCrudError {}

impl BalanceCrudError {
    /// Nombre del error para cruzar el IPC (REQ-04-06).
    pub fn codigo(&self) -> &'static str {
        match self {
            Self::ValorNegativo(_) | Self::CategoriaInvalida { .. } => "ValidacionError",
            Self::Carga(_) => "SnapshotLoadError",
            Self::Guardado(_) => "SnapshotSaveError",
        }
    }
}
