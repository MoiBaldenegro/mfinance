//! Validación de la hipótesis del simulador (REQ-15-05): importe
//! positivo, plazo mayor que cero, tasa no negativa y extras aplicables
//! al plazo del crédito. Mensajes de error en español.

use crate::application::simulador_creditos::errores::ErrorSimulacion;
use crate::application::simulador_creditos::types::{CreditoSimulado, ExtrasOptimizacion};

/// Valida importe positivo, plazo mayor que cero y tasa no negativa.
pub fn validar_credito(credito: &CreditoSimulado) -> Result<(), ErrorSimulacion> {
    if credito.importe <= 0.0 {
        return Err(ErrorSimulacion::ImporteNoPositivo(credito.importe));
    }
    if credito.plazo_meses == 0 {
        return Err(ErrorSimulacion::PlazoInvalido(credito.plazo_meses));
    }
    if credito.tasa_interes_anual < 0.0 {
        return Err(ErrorSimulacion::TasaNegativa(credito.tasa_interes_anual));
    }
    Ok(())
}

/// Valida que los extras sean aplicables al plazo del crédito.
pub fn validar_extras(
    extras: &ExtrasOptimizacion,
    plazo_meses: u32,
) -> Result<(), ErrorSimulacion> {
    for extraordinario in &extras.extraordinarios {
        let fuera_de_rango = extraordinario.mes == 0 || extraordinario.mes > plazo_meses;
        if fuera_de_rango || extraordinario.importe <= 0.0 {
            return Err(ErrorSimulacion::ExtraordinarioInvalido {
                mes: extraordinario.mes,
                plazo_meses,
            });
        }
    }
    Ok(())
}
