//! REQ-23-07: actualiza los datos parciales de onboarding de un perfil.

use crate::domain::onboarding::{OnboardingData, OnboardingStatus};
use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;

/// Actualiza los datos parciales de onboarding de un perfil (REQ-23-07).
/// Recibe el perfil_id y un OnboardingData parcial; fusiona con lo existente.
pub fn actualizar_onboarding(
    repo: &mut dyn PerfilRepository,
    perfil_id: &str,
    datos_parciales: OnboardingData,
) -> Result<(), PerfilError> {
    let mut registro = repo.cargar_registro()?.ok_or_else(|| {
        PerfilError::PerfilInexistente(perfil_id.to_string())
    })?;

    let perfil = registro
        .perfiles
        .iter_mut()
        .find(|p| p.id == perfil_id)
        .ok_or_else(|| PerfilError::PerfilInexistente(perfil_id.to_string()))?;

    // Fusionar datos parciales: solo actualizar los pasos que vengan en Some
    if let Some(paso1) = datos_parciales.paso1 {
        perfil.onboarding_data.paso1 = Some(paso1);
    }
    if let Some(paso2) = datos_parciales.paso2 {
        perfil.onboarding_data.paso2 = Some(paso2);
    }
    if let Some(paso3) = datos_parciales.paso3 {
        perfil.onboarding_data.paso3 = Some(paso3);
    }
    if let Some(paso4) = datos_parciales.paso4 {
        perfil.onboarding_data.paso4 = Some(paso4);
    }

    // Si el onboarding estaba NotStarted, pasa a InProgress step 1
    if matches!(perfil.onboarding_status, OnboardingStatus::NotStarted) {
        perfil.onboarding_status = OnboardingStatus::InProgress { current_step: 1 };
    }

    repo.guardar_registro(&registro)?;
    Ok(())
}