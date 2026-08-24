//! REQ-03-07: un tipo de error nombrado propio para cada operación
//! fallible del puerto SnapshotRepository (load save export import).

use std::error::Error;
use std::fmt;

/// Fallo al cargar el snapshot vigente.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SnapshotLoadError {
    /// Motivo del fallo, legible en español.
    pub reason: String,
}

impl SnapshotLoadError {
    pub fn new(reason: &str) -> Self {
        Self { reason: reason.to_string() }
    }
}

impl fmt::Display for SnapshotLoadError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "no se pudo cargar el snapshot: {}", self.reason)
    }
}

impl Error for SnapshotLoadError {}

/// Fallo al guardar el snapshot vigente.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SnapshotSaveError {
    pub reason: String,
}

impl SnapshotSaveError {
    pub fn new(reason: &str) -> Self {
        Self { reason: reason.to_string() }
    }
}

impl fmt::Display for SnapshotSaveError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "no se pudo guardar el snapshot: {}", self.reason)
    }
}

impl Error for SnapshotSaveError {}

/// Fallo al exportar una copia del snapshot.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SnapshotExportError {
    pub reason: String,
}

impl SnapshotExportError {
    pub fn new(reason: &str) -> Self {
        Self { reason: reason.to_string() }
    }
}

impl fmt::Display for SnapshotExportError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "no se pudo exportar el snapshot: {}", self.reason)
    }
}

impl Error for SnapshotExportError {}

/// Fallo al importar un snapshot desde la copia externa.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SnapshotImportError {
    pub reason: String,
}

impl SnapshotImportError {
    pub fn new(reason: &str) -> Self {
        Self { reason: reason.to_string() }
    }
}

impl fmt::Display for SnapshotImportError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "no se pudo importar el snapshot: {}", self.reason)
    }
}

impl Error for SnapshotImportError {}
