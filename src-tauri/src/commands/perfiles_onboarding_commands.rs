//! Handlers #[tauri::command] FINOS de onboarding de perfiles
//! (REQ-23-07/08/09): actualizar_perfil_onboarding, completar_onboarding,
//! obtener_onboarding_status. Delegan en application/ sin lógica de negocio
//! ni acceso directo al filesystem.

use tauri::State;

use crate::application::perfiles_onboarding;
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::domain::onboarding::{OnboardingData, OnboardingStatus};
use crate::domain::perfil::Perfil;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

type LockedRepo<'a> = std::sync::MutexGuard<'a, JsonSnapshotRepository>;

fn locked(state: &AppState) -> Result<LockedRepo<'_>, CommandError> {
    state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })
}

/// Actualiza los datos parciales de onboarding del perfil activo.
#[tauri::command]
pub fn actualizar_perfil_onboarding(
    perfil_id: String,
    datos: OnboardingData,
    state: State<AppState>,
) -> Result<(), CommandError> {
    let mut repo = locked(&state)?;
    perfiles_onboarding::actualizar_onboarding(&mut *repo, &perfil_id, datos)
        .map_err(CommandError::from)
}

/// Completa el onboarding del perfil (REQ-27-06 vía REQ-23-08): activa
/// el perfil, consolida financial_profile/status y SU snapshot.
#[tauri::command]
pub fn completar_onboarding(
    perfil_id: String,
    state: State<AppState>,
) -> Result<Perfil, CommandError> {
    let mut repo = locked(&state)?;
    let perfil = completar_onboarding_core(&mut *repo, &perfil_id)?;

    // Sincronizar comprobantes con el perfil activo (igual que seleccionar_perfil)
    sincronizar_comprobantes(&state, Some(&perfil.id))?;
    Ok(perfil)
}

/// Núcleo sin tipos de Tauri del handler anterior: la RUTA DEL COMMAND
/// que los tests ejercitan. Delega en el caso de uso REQ-27-06 que
/// activa el perfil, completa su registro y consolida SU snapshot
/// (moneda/estrategia/pago extra/tasas) sobre el adapter único.
pub(crate) fn completar_onboarding_core(
    repo: &mut JsonSnapshotRepository,
    perfil_id: &str,
) -> Result<Perfil, CommandError> {
    perfiles_onboarding::completar_onboarding_en_adaptador(repo, perfil_id)
        .map_err(CommandError::from)
}

/// Devuelve el estado de onboarding actual del perfil indicado.
#[tauri::command]
pub fn obtener_onboarding_status(
    perfil_id: String,
    state: State<AppState>,
) -> Result<OnboardingStatus, CommandError> {
    let mut repo = locked(&state)?;
    perfiles_onboarding::obtener_onboarding_status(&mut *repo, &perfil_id)
        .map_err(CommandError::from)
}

/// Cable de sesión: fija el perfil activo en el almacén de comprobantes.
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