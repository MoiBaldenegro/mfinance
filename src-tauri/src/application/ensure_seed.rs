//! REQ-04-02: siembra datos de ejemplo cuando no hay nada guardado.
//! Un archivo existente (aunque esté corrupto) nunca se pisa en silencio:
//! el guard de legibilidad vive aquí (`load().is_ok()`), invocado desde
//! la preparación del arranque con perfiles (REQ-21-05).

use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotSaveError;
use crate::seed;

/// Siembra el ejemplo si el repositorio está vacío. Devuelve true solo
/// cuando efectivamente sembró; false si ya había datos cargables.
pub fn ensure_seed(
    repository: &mut dyn SnapshotRepository,
) -> Result<bool, SnapshotSaveError> {
    if repository.load().is_ok() {
        return Ok(false);
    }
    repository.save(&seed::example_snapshot())?;
    Ok(true)
}
