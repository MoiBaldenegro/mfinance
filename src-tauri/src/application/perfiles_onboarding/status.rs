//! REQ-23-09: devuelve el estado actual del onboarding de un perfil.

use crate::domain::onboarding::OnboardingStatus;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;

/// Devuelve el estado actual del onboarding de un perfil (REQ-23-09).
pub fn obtener_onboarding_status(
    repo: &mut dyn PerfilRepository,
    perfil_id: &str,
) -> Result<OnboardingStatus, PerfilError> {
    let registro = repo.cargar_registro()?.ok_or_else(|| {
        PerfilError::PerfilInexistente(perfil_id.to_string())
    })?;

    let perfil = registro
        .perfiles
        .iter()
        .find(|p| p.id == perfil_id)
        .ok_or_else(|| PerfilError::PerfilInexistente(perfil_id.to_string()))?;

    Ok(perfil.onboarding_status)
}