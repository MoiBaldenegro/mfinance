//! Comparador base vs optimizado (REQ-15-02/04): simula el crédito sin
//! extras y con extras y deriva meses e intereses ahorrados.

use crate::application::simulador_creditos::errores::ErrorSimulacion;
use crate::application::simulador_creditos::motor::amortizar_con_extras;
use crate::application::simulador_creditos::resultado::SimulacionComparada;
use crate::application::simulador_creditos::types::{ExtrasOptimizacion, PeticionSimulacion};
use crate::application::simulador_creditos::validacion::{validar_credito, validar_extras};

/// Compara el escenario base contra el optimizado del crédito simulado.
pub fn simular_comparada(
    peticion: &PeticionSimulacion,
) -> Result<SimulacionComparada, ErrorSimulacion> {
    validar_credito(&peticion.credito)?;
    validar_extras(&peticion.extras, peticion.credito.plazo_meses)?;

    let sin_extras = ExtrasOptimizacion {
        extra_mensual: 0.0,
        extraordinarios: Vec::new(),
    };
    let base = amortizar_con_extras(&peticion.credito, &sin_extras);
    let optimizado = amortizar_con_extras(&peticion.credito, &peticion.extras);

    Ok(SimulacionComparada {
        meses_ahorrados: base.meses.saturating_sub(optimizado.meses),
        intereses_ahorrados: (base.intereses_totales - optimizado.intereses_totales).max(0.0),
        base,
        optimizado,
    })
}
