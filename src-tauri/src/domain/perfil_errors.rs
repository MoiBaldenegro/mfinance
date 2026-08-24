//! REQ-21-06: errores nombrados del modelo de perfiles. Cada fallo
//! lleva su nombre explícito y un motivo legible en español; ninguna
//! operación fallida altera datos vigentes.

use std::error::Error;
use std::fmt;

/// Errores del registro de perfiles y de sus operaciones.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PerfilError {
    /// Nombre solicitado vacío o solo con espacios.
    NombreVacio,
    /// Ya existe otro perfil con el mismo nombre.
    NombreDuplicado(String),
    /// profiles.json existe pero no es un registro válido.
    RegistroCorrupto(String),
    /// El id indicado no corresponde a ningún perfil conocido.
    PerfilInexistente(String),
    /// Fallo de filesystem al persistir el registro o el legado.
    Persistencia(String),
}

impl PerfilError {
    /// Nombre estable del error, expuesto así al cruzar el IPC.
    pub fn codigo(&self) -> &'static str {
        match self {
            Self::NombreVacio => "PerfilNombreVacioError",
            Self::NombreDuplicado(_) => "PerfilNombreDuplicadoError",
            Self::RegistroCorrupto(_) => "PerfilRegistroCorruptoError",
            Self::PerfilInexistente(_) => "PerfilInexistenteError",
            Self::Persistencia(_) => "PerfilPersistenciaError",
        }
    }
}

impl fmt::Display for PerfilError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NombreVacio => {
                write!(f, "el nombre del perfil no puede estar vacío")
            }
            Self::NombreDuplicado(nombre) => {
                write!(f, "ya existe un perfil llamado «{nombre}»")
            }
            Self::RegistroCorrupto(motivo) => {
                write!(f, "el registro de perfiles está corrupto: {motivo}")
            }
            Self::PerfilInexistente(id) => {
                write!(f, "no existe ningún perfil con id «{id}»")
            }
            Self::Persistencia(motivo) => {
                write!(
                    f,
                    "no se pudo guardar el registro de perfiles: {motivo}"
                )
            }
        }
    }
}

impl Error for PerfilError {}
