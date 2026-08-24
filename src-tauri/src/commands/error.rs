//! Error de la capa de entrada: conserva el NOMBRE del error de dominio
//! (campo `codigo`) y su motivo legible para cruzar el IPC sin perder
//! la trazabilidad exigida por REQ-04-06.

use serde::Serialize;

use crate::domain::repository_errors::{
    SnapshotExportError, SnapshotImportError, SnapshotLoadError,
    SnapshotSaveError,
};

/// Error nombrado y serializable devuelto por los commands.
#[derive(Debug, Clone, Serialize)]
pub struct CommandError {
    /// Nombre del error (p. ej. "SnapshotImportError").
    pub codigo: String,
    /// Motivo legible en español.
    pub mensaje: String,
}

impl CommandError {
    /// Construye desde un código y un error; visible al resto de
    /// conversiones del crate (p. ej. error_conciliacion).
    pub(crate) fn nueva(codigo: &str, error: &dyn std::error::Error) -> Self {
        Self { codigo: codigo.to_string(), mensaje: error.to_string() }
    }

    /// Fallo técnico interno (p. ej. lock envenenado del estado).
    pub fn interno(mensaje: &str) -> Self {
        Self {
            codigo: "EstadoBloqueadoError".to_string(),
            mensaje: mensaje.to_string(),
        }
    }

    /// Error de validación de dominio (valores negativos, etc.).
    pub fn validacion(mensaje: &str) -> Self {
        Self {
            codigo: "ValidacionError".to_string(),
            mensaje: mensaje.to_string(),
        }
    }
}

macro_rules! from_domain_error {
    ($($tipo:ty => $codigo:literal),* $(,)?) => {$(
        impl From<$tipo> for CommandError {
            fn from(error: $tipo) -> Self {
                Self::nueva($codigo, &error)
            }
        }
    )*};
}

from_domain_error!(
    SnapshotLoadError => "SnapshotLoadError",
    SnapshotSaveError => "SnapshotSaveError",
    SnapshotExportError => "SnapshotExportError",
    SnapshotImportError => "SnapshotImportError",
);

impl From<crate::domain::perfil_errors::PerfilError> for CommandError {
    fn from(error: crate::domain::perfil_errors::PerfilError) -> Self {
        Self {
            codigo: error.codigo().to_string(),
            mensaje: error.to_string(),
        }
    }
}

impl From<crate::application::inversiones_proyeccion::ProyeccionError> for CommandError {
    fn from(error: crate::application::inversiones_proyeccion::ProyeccionError) -> Self {
        match error {
            crate::application::inversiones_proyeccion::ProyeccionError::Carga(e) => {
                Self::nueva("SnapshotLoadError", &e)
            }
            crate::application::inversiones_proyeccion::ProyeccionError::Tasa(e) => {
                Self::nueva("ValidacionError", &e)
            }
        }
    }
}

impl From<crate::application::simulador_creditos::ErrorSimulacion> for CommandError {
    fn from(error: crate::application::simulador_creditos::ErrorSimulacion) -> Self {
        Self { codigo: error.codigo().to_string(), mensaje: error.to_string() }
    }
}

impl From<crate::application::pyg_proyeccion::ProyeccionError> for CommandError {
    fn from(error: crate::application::pyg_proyeccion::ProyeccionError) -> Self {
        match error {
            crate::application::pyg_proyeccion::ProyeccionError::Carga(e) => {
                Self::nueva("SnapshotLoadError", &e)
            }
        }
    }
}
