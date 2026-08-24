//! REQ-21-01: agregado del registro de perfiles persistido en
//! profiles.json: lista de perfiles e indicador del perfil activo.

use serde::{Deserialize, Serialize};

use crate::domain::perfil::Perfil;

/// Estado del registro: qué perfiles existen y cuál está activo.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct RegistroPerfiles {
    /// Id del perfil activo; `None` solo antes del primer alta.
    pub activa: Option<String>,
    /// Perfiles existentes, en orden de creación.
    #[serde(default)]
    pub perfiles: Vec<Perfil>,
}
