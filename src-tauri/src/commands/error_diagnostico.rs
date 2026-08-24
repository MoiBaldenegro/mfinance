//! Conversión del error de diagnóstico al error de IPC conservando el
//! nombre del error de aplicación como código (patrón de error.rs).

use crate::application::diagnostico::DiagnosticoError;
use crate::commands::error::CommandError;

impl From<DiagnosticoError> for CommandError {
    fn from(error: DiagnosticoError) -> Self {
        Self {
            codigo: error.codigo().to_string(),
            mensaje: error.to_string(),
        }
    }
}
