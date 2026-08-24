//! Conversión de `ConciliacionError` a `CommandError`: extraída de
//! error.rs para mantener ambos archivos por debajo del límite de líneas.
//! Conserva el nombre del error (código) y su motivo legible.

use crate::commands::error::CommandError;
use std::error::Error;
use std::fmt;

/// Envoltorio mínimo para motivos textuales que no son `Error`.
#[derive(Debug)]
struct SimpleError(String);

impl fmt::Display for SimpleError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Error for SimpleError {}

impl From<crate::application::conciliacion::ConciliacionError> for CommandError {
    fn from(error: crate::application::conciliacion::ConciliacionError) -> Self {
        match error {
            crate::application::conciliacion::ConciliacionError::SinDatos => {
                CommandError::nueva("ConciliacionError", &error)
            }
            crate::application::conciliacion::ConciliacionError::CuentaNoEncontrada(_) => {
                CommandError::nueva("ValidacionError", &error)
            }
            crate::application::conciliacion::ConciliacionError::MovimientoInvalido(_) => {
                CommandError::nueva("ValidacionError", &error)
            }
            crate::application::conciliacion::ConciliacionError::Carga(msg) => {
                CommandError::nueva(
                    "SnapshotLoadError",
                    &SimpleError(format!("error de carga: {}", msg)),
                )
            }
            crate::application::conciliacion::ConciliacionError::Guardado(msg) => {
                CommandError::nueva(
                    "SnapshotSaveError",
                    &SimpleError(format!("error de guardado: {}", msg)),
                )
            }
        }
    }
}
