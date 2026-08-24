//! Fachada de indicadores: carga el snapshot del repo y delega al motor puro.

use crate::application::indicadores_engine::calcular_indicadores;
use crate::application::indicadores_types::Indicadores;
use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotLoadError;

/// Calcula los indicadores del estado vigente delegando la carga en el puerto.
pub fn indicadores(
    repository: &dyn SnapshotRepository,
) -> Result<Indicadores, SnapshotLoadError> {
    Ok(calcular_indicadores(&repository.load()?))
}