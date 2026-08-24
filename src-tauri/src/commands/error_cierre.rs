//! Conversión de `ErrorCierre` a `CommandError`: extraída de error.rs
//! para mantener ambos archivos por debajo del límite de líneas.
//! Conserva el nombre del error (código) y su motivo legible.

use crate::application::cierre::errores::ErrorCierre;
use crate::commands::error::CommandError;

impl From<ErrorCierre> for CommandError {
    fn from(error: ErrorCierre) -> Self {
        match error {
            ErrorCierre::Carga(_) => CommandError::nueva("SnapshotLoadError", &error),
            ErrorCierre::Guardado(_) => CommandError::nueva("SnapshotSaveError", &error),
            ErrorCierre::MesYaCerrado(_) => CommandError::nueva("MesYaCerradoError", &error),
            ErrorCierre::MesNoCerrado(_) => CommandError::nueva("MesNoCerradoError", &error),
            ErrorCierre::MesInvalido(_) => CommandError::nueva("ValidacionError", &error),
        }
    }
}
