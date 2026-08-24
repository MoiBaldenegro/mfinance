//! REQ-29-01: Caso de uso que devuelve el snapshot y el onboarding_status
//! del perfil activo en una sola operación para el gate de arranque.

use crate::domain::onboarding::OnboardingStatus;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;
use crate::domain::perfil_errors::PerfilError;

/// Estructura de respuesta combinada para el gate de arranque.
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct PerfilActivoConOnboarding {
    pub snapshot: FinanceSnapshot,
    pub onboarding_status: OnboardingStatus,
}

/// Recupera el snapshot y el onboarding_status del perfil activo.
/// Diseñado para la carga inicial del frontend: una sola llamada IPC
/// evita race conditions entre load_state y obtener_onboarding_status.
pub fn obtener_perfil_activo_con_onboarding<R>(
    repo: &mut R,
) -> Result<PerfilActivoConOnboarding, PerfilError>
where
    R: PerfilRepository + SnapshotRepository,
{
    // Obtener el perfil activo (esto también restaura repo.activo en el adapter)
    let perfil_activo = super::perfiles::activo(repo)?
        .ok_or_else(|| PerfilError::PerfilInexistente("no hay perfil activo".to_string()))?;

    let onboarding_status = perfil_activo.onboarding_status;

    // Cargar el snapshot del perfil activo
    let snapshot = repo.load().map_err(|error| {
        PerfilError::Persistencia(format!(
            "no se pudo cargar el snapshot del perfil activo: {error}"
        ))
    })?;

    Ok(PerfilActivoConOnboarding {
        snapshot,
        onboarding_status,
    })
}