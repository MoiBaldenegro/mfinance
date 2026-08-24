//! Errores nombrados del dominio (REQ-03-07/08): cada rechazo tiene su
//! propio tipo, nunca errores genéricos de librerías externas.

use std::error::Error;
use std::fmt;

pub use crate::domain::negative_value::NegativeValueError;

/// Fuente de ingreso fuera del catálogo definido.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnknownSourceError {
    /// Clave rechazada tal cual llegó.
    pub valor: String,
}

impl UnknownSourceError {
    pub fn new(valor: &str) -> Self {
        Self { valor: valor.to_string() }
    }
}

impl fmt::Display for UnknownSourceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "fuente de ingreso desconocida: \"{}\"", self.valor)
    }
}

impl Error for UnknownSourceError {}

/// Categoría de gasto fuera del catálogo definido.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnknownCategoryError {
    pub valor: String,
}

impl UnknownCategoryError {
    pub fn new(valor: &str) -> Self {
        Self { valor: valor.to_string() }
    }
}

impl fmt::Display for UnknownCategoryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "categoría de gasto desconocida: \"{}\"", self.valor)
    }
}

impl Error for UnknownCategoryError {}

/// Familia de inversión fuera del catálogo definido.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnknownFamilyError {
    pub valor: String,
}

impl UnknownFamilyError {
    pub fn new(valor: &str) -> Self {
        Self { valor: valor.to_string() }
    }
}

impl fmt::Display for UnknownFamilyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "familia de inversión desconocida: \"{}\"", self.valor)
    }
}

impl Error for UnknownFamilyError {}

/// Tasa esperada fuera del rango permitido [0, 30] (REQ-11-05).
#[derive(Debug, Clone, PartialEq)]
pub struct TasaFueraDeRangoError {
    pub familia: String,
    pub tasa: f64,
}

impl TasaFueraDeRangoError {
    pub fn new(familia: &str, tasa: f64) -> Self {
        Self { familia: familia.to_string(), tasa }
    }
}

impl fmt::Display for TasaFueraDeRangoError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "tasa esperada fuera de rango para {}: {}% (debe ser 0-30%)",
            self.familia, self.tasa
        )
    }
}

impl Error for TasaFueraDeRangoError {}

/// Errores de validación de GoalEntry (REQ-23-11).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GoalEntryError {
    /// Título vacío.
    TituloVacio,
    /// Título excede 100 caracteres.
    TituloMuyLargo(usize),
    /// Descripción excede 5000 caracteres.
    DescripcionMuyLarga(usize),
    /// Tags exceden el máximo de 5.
    DemasiadosTags(usize),
    /// Algún tag está vacío.
    TagVacio(usize),
    /// Algún tag excede 20 caracteres.
    TagMuyLargo(usize),
}

impl GoalEntryError {
    /// Código estable para cruzar IPC.
    pub fn codigo(&self) -> &'static str {
        match self {
            Self::TituloVacio => "GoalEntryTituloVacioError",
            Self::TituloMuyLargo(_) => "GoalEntryTituloMuyLargoError",
            Self::DescripcionMuyLarga(_) => "GoalEntryDescripcionMuyLargaError",
            Self::DemasiadosTags(_) => "GoalEntryDemasiadosTagsError",
            Self::TagVacio(_) => "GoalEntryTagVacioError",
            Self::TagMuyLargo(_) => "GoalEntryTagMuyLargoError",
        }
    }
}

impl fmt::Display for GoalEntryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::TituloVacio => write!(f, "el título de la meta no puede estar vacío"),
            Self::TituloMuyLargo(len) => write!(f, "el título no puede exceder 100 caracteres (tiene {len})"),
            Self::DescripcionMuyLarga(len) => write!(f, "la descripción no puede exceder 5000 caracteres (tiene {len})"),
            Self::DemasiadosTags(n) => write!(f, "no puede haber más de 5 tags (hay {n})"),
            Self::TagVacio(idx) => write!(f, "el tag en posición {idx} no puede estar vacío"),
            Self::TagMuyLargo(idx) => write!(f, "el tag en posición {idx} no puede exceder 20 caracteres"),
        }
    }
}

impl Error for GoalEntryError {}
