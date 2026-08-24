//! REQ-23-08: completa el onboarding consolidando datos y marcando status = Completed.

use crate::domain::onboarding::OnboardingStatus;
use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;

/// Completa el onboarding consolidando datos en StrategySettings/Investment/financial_profile
/// y marcando status = Completed (REQ-23-08).
pub fn completar_onboarding(
    repo: &mut dyn PerfilRepository,
    perfil_id: &str,
) -> Result<Perfil, PerfilError> {
    let mut registro = repo.cargar_registro()?.ok_or_else(|| {
        PerfilError::PerfilInexistente(perfil_id.to_string())
    })?;

    let perfil_idx = registro
        .perfiles
        .iter()
        .position(|p| p.id == perfil_id)
        .ok_or_else(|| PerfilError::PerfilInexistente(perfil_id.to_string()))?;

    // Consolidar onboarding_data en financial_profile y StrategySettings
    consolidar_onboarding_en_perfil(&mut registro.perfiles[perfil_idx]);

    // Marcar como completado
    registro.perfiles[perfil_idx].onboarding_status = OnboardingStatus::Completed;

    // Clonar el perfil antes de guardar para evitar problemas de borrow
    let perfil_clonado = registro.perfiles[perfil_idx].clone();

    // Guardar el registro actualizado
    repo.guardar_registro(&registro)?;

    Ok(perfil_clonado)
}

/// Consolida los datos del onboarding en financial_profile y StrategySettings.
/// Se llama desde completar_onboarding.
fn consolidar_onboarding_en_perfil(perfil: &mut Perfil) {
    let data = &perfil.onboarding_data;

    // Paso 1: fuentes ingreso, categorías gasto, moneda
    if let Some(p1) = &data.paso1 {
        perfil.financial_profile.fuentes_ingreso_activas = p1.fuentes_ingreso_activas.clone();
        perfil.financial_profile.categorias_gasto_usadas = p1.categorias_gasto_usadas.clone();
        // La moneda se aplica al StrategySettings del snapshot, no al perfil directamente
        // (eso se hace en el command que tiene acceso al snapshot)
    }

    // Paso 3: estrategia deuda, pago extra
    if let Some(p3) = &data.paso3 {
        perfil.financial_profile.estrategia_deuda_preferida = p3.estrategia_deuda.clone();
        perfil.financial_profile.pago_extra_mensual = p3.pago_extra_mensual;
        perfil.financial_profile.umbrales_indicadores = data
            .paso4
            .as_ref()
            .map(|p4| p4.umbrales.clone())
            .unwrap_or_default();
    }

    // Paso 2: familias de inversión activas con tasas
    if let Some(p2) = &data.paso2 {
        perfil.financial_profile.familias_inversion_activas = p2
            .inversiones
            .iter()
            .map(|inv| crate::domain::onboarding::FamiliaInversionActiva {
                familia: inv.familia.clone(),
                tasa_esperada_anual: inv.tasa_esperada_anual,
            })
            .collect();
    }

    // Paso 4: umbrales indicadores (si no vino en paso3)
    if let Some(p4) = &data.paso4 {
        perfil.financial_profile.umbrales_indicadores = p4.umbrales.clone();
    }
}