//! Handlers #[tauri::command] FINOS del journal de metas (REQ-27-10):
//! agregar_meta, actualizar_meta, eliminar_meta. Delegan en
//! application/perfiles_onboarding::goals sin lógica de negocio ni
//! acceso directo al filesystem. La lectura llega gratis con listar_
//! perfiles / perfil_activo (goals_journal viaja dentro de Perfil).

use tauri::State;

use crate::application::perfiles_onboarding;
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::domain::onboarding::GoalEntry;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

type LockedRepo<'a> = std::sync::MutexGuard<'a, JsonSnapshotRepository>;

fn locked(state: &AppState) -> Result<LockedRepo<'_>, CommandError> {
    state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })
}

/// Añade una meta al goals_journal del perfil indicado.
#[tauri::command]
pub fn agregar_meta(
    perfil_id: String,
    titulo: String,
    descripcion: String,
    tags: Vec<String>,
    state: State<AppState>,
) -> Result<GoalEntry, CommandError> {
    let mut repo = locked(&state)?;
    perfiles_onboarding::agregar_goal(&mut *repo, &perfil_id, titulo, descripcion, tags)
        .map_err(CommandError::from)
}

/// Actualiza una meta existente (preserva id y creado_en).
#[tauri::command]
pub fn actualizar_meta(
    perfil_id: String,
    meta_id: String,
    titulo: String,
    descripcion: String,
    tags: Vec<String>,
    state: State<AppState>,
) -> Result<GoalEntry, CommandError> {
    let mut repo = locked(&state)?;
    perfiles_onboarding::actualizar_goal(
        &mut *repo, &perfil_id, &meta_id, titulo, descripcion, tags,
    )
    .map_err(CommandError::from)
}

/// Elimina una meta del journal por su id.
#[tauri::command]
pub fn eliminar_meta(
    perfil_id: String,
    meta_id: String,
    state: State<AppState>,
) -> Result<(), CommandError> {
    let mut repo = locked(&state)?;
    perfiles_onboarding::eliminar_goal(&mut *repo, &perfil_id, &meta_id)
        .map_err(CommandError::from)
}
