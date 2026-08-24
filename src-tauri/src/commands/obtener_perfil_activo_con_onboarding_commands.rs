//! Handler #[tauri::command] FINO para obtener_perfil_activo_con_onboarding (REQ-29-01).
//! Devuelve { snapshot, onboarding_status } del perfil activo en una sola llamada.

use tauri::State;

use crate::application::obtener_perfil_activo_con_onboarding;
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::domain::onboarding::OnboardingStatus;
use crate::domain::snapshot::FinanceSnapshot;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

type LockedRepo<'a> = std::sync::MutexGuard<'a, JsonSnapshotRepository>;

fn locked(state: &AppState) -> Result<LockedRepo<'_>, CommandError> {
    state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })
}

/// Estructura de respuesta para el command (debe coincidir con el frontend).
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PerfilActivoConOnboardingResponse {
    pub snapshot: FinanceSnapshot,
    pub onboarding_status: OnboardingStatus,
}

/// Recupera el snapshot y el onboarding_status del perfil activo.
/// Una sola llamada evita race conditions en el gate de arranque.
#[tauri::command]
pub fn obtener_perfil_activo_con_onboarding(
    state: State<AppState>,
) -> Result<PerfilActivoConOnboardingResponse, CommandError> {
    let mut repo = locked(&state)?;
    let resultado = obtener_perfil_activo_con_onboarding::obtener_perfil_activo_con_onboarding(&mut *repo)
        .map_err(CommandError::from)?;
    Ok(PerfilActivoConOnboardingResponse {
        snapshot: resultado.snapshot,
        onboarding_status: resultado.onboarding_status,
    })
}