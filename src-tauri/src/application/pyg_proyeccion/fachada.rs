//! REQ-14-01/02: fachada de la proyección sobre el puerto de snapshots:
//! carga el estado vigente y delega en los motores puros. Define el
//! error nombrado que asciende por los commands finos.

use super::engine_balance::calcular_balance_futuro;
use super::engine_pyg::calcular_proyeccion_pyg;
use super::types::{BalanceFuturo, ProyeccionPyg, SupuestosProyeccion};
use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotLoadError;

/// Errores nombrados de la proyección (hoy: solo carga del snapshot).
#[derive(Debug)]
pub enum ProyeccionError {
    /// El repositorio no pudo cargar el estado vigente.
    Carga(SnapshotLoadError),
}

impl From<SnapshotLoadError> for ProyeccionError {
    fn from(e: SnapshotLoadError) -> Self {
        ProyeccionError::Carga(e)
    }
}

impl std::fmt::Display for ProyeccionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProyeccionError::Carga(e) => write!(f, "{e}"),
        }
    }
}

/// Calcula la proyección PyG del estado vigente delegando la carga en el puerto.
pub fn proyeccion_pyg(
    repository: &dyn SnapshotRepository,
    supuestos: &SupuestosProyeccion,
) -> Result<ProyeccionPyg, ProyeccionError> {
    let snapshot = repository.load()?;
    Ok(calcular_proyeccion_pyg(&snapshot, supuestos))
}

/// Calcula el balance futuro del estado vigente delegando la carga en el puerto.
pub fn balance_futuro(
    repository: &dyn SnapshotRepository,
    supuestos: &SupuestosProyeccion,
) -> Result<BalanceFuturo, ProyeccionError> {
    let snapshot = repository.load()?;
    Ok(calcular_balance_futuro(&snapshot, supuestos))
}
