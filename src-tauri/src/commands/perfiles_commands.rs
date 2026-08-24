//! Handlers #[tauri::command] FINOS de perfiles (REQ-21-08): listar,
//! crear y seleccionar. Delegan en application/ sin lógica de negocio
//! ni acceso directo al filesystem. seleccionar además sincroniza la
//! sesión de comprobantes con el nuevo activo (mismo cable de sesión
//! que set_transfer_path en export_json).

use tauri::State;

use crate::application::perfiles;
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::domain::perfil::Perfil;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

type LockedRepo<'a> = std::sync::MutexGuard<'a, JsonSnapshotRepository>;

fn locked(state: &AppState) -> Result<LockedRepo<'_>, CommandError> {
    state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })
}

/// Lista los perfiles registrados.
#[tauri::command]
pub fn listar_perfiles(
    state: State<AppState>,
) -> Result<Vec<Perfil>, CommandError> {
    let mut repo = locked(&state)?;
    perfiles::listar(&mut *repo).map_err(CommandError::from)
}

/// Perfil activo actual, si lo hay (REQ-22-02/04): lectura para la UI.
#[tauri::command]
pub fn perfil_activo(
    state: State<AppState>,
) -> Result<Option<Perfil>, CommandError> {
    let mut repo = locked(&state)?;
    perfiles::activo(&mut *repo).map_err(CommandError::from)
}

/// Crea un perfil nuevo con el nombre solicitado.
#[tauri::command]
pub fn crear_perfil(
    nombre: String,
    state: State<AppState>,
) -> Result<Perfil, CommandError> {
    let mut repo = locked(&state)?;
    perfiles::crear(&mut *repo, &nombre).map_err(CommandError::from)
}

/// Activa el perfil indicado: los commands de estado pasarán a operar
/// sobre SU snapshot y sus comprobantes quedan aislados bajo su id.
#[tauri::command]
pub fn seleccionar_perfil(
    id: String,
    state: State<AppState>,
) -> Result<Perfil, CommandError> {
    let mut repo = locked(&state)?;
    let perfil =
        perfiles::seleccionar(&mut *repo, &id).map_err(CommandError::from)?;
    sincronizar_comprobantes(&state, repo.activo())?;
    Ok(perfil)
}

/// Cable de sesión entre adapters: fija el perfil activo en el almacén
/// de comprobantes para que su ruta incluya el id (REQ-21-07).
fn sincronizar_comprobantes(
    state: &AppState,
    activo: Option<&str>,
) -> Result<(), CommandError> {
    let Some(activo) = activo else {
        return Ok(());
    };
    let mut comprobantes = state.comprobantes.lock().map_err(|_| {
        CommandError::interno("los comprobantes están bloqueados")
    })?;
    comprobantes.set_perfil(activo.to_string());
    Ok(())
}
