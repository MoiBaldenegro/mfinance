//! REQ-15-03: avalancha y bola de nieve sobre varios créditos simulados.
//! Reutiliza las primitivas del motor de plan de deuda (ordenaciones y
//! proyección mes a mes) mapeando cada crédito a una `DeudaPlan` cuyo
//! pago mínimo es su cuota francesa.

use crate::application::plan_deuda_simulacion::{
    ordenar_por_saldo, ordenar_por_tasa, proyectar_orden, DeudaPlan,
};
use crate::application::simulador_creditos::cuota::cuota_mensual;
use crate::application::simulador_creditos::errores::ErrorSimulacion;
use crate::application::simulador_creditos::resultado::{
    EscenarioEstrategia, PlanCreditosSimulados,
};
use crate::application::simulador_creditos::types::CreditoSimulado;
use crate::application::simulador_creditos::validacion::validar_credito;
use crate::domain::snapshot::DebtStrategy;

/// Mapea un crédito simulado a la deuda que entiende el motor del plan:
/// saldo = importe, tasa = tasa anual, pago mínimo = cuota francesa.
fn deuda_desde_credito(credito: &CreditoSimulado) -> DeudaPlan {
    DeudaPlan {
        nombre: credito.nombre.clone(),
        saldo_pendiente: credito.importe,
        tasa_interes_anual: credito.tasa_interes_anual,
        pago_minimo_mensual: cuota_mensual(
            credito.importe,
            credito.plazo_meses,
            credito.tasa_interes_anual,
        ),
    }
}

fn escenario(
    estrategia: DebtStrategy,
    ordenadas: &[DeudaPlan],
    extra_mensual: f64,
) -> EscenarioEstrategia {
    let base = proyectar_orden(ordenadas, 0.0);
    let optimizado = proyectar_orden(ordenadas, extra_mensual.max(0.0));
    EscenarioEstrategia {
        estrategia,
        orden_de_ataque: ordenadas.iter().map(|d| d.nombre.clone()).collect(),
        deuda_objetivo: ordenadas.first().map(|d| d.nombre.clone()),
        meses_base: base.meses_hasta_libre,
        intereses_base: base.intereses_totales,
        meses_optimizado: optimizado.meses_hasta_libre,
        intereses_optimizado: optimizado.intereses_totales,
        meses_ahorrados: base.meses_hasta_libre.saturating_sub(optimizado.meses_hasta_libre),
        intereses_ahorrados: (base.intereses_totales - optimizado.intereses_totales).max(0.0),
    }
}

/// Aplica las dos estrategias sobre los créditos simulados devolviendo
/// por escenario el orden de ataque y los intereses base vs optimizado.
pub fn simular_plan_creditos(
    creditos: &[CreditoSimulado],
    extra_mensual: f64,
) -> Result<PlanCreditosSimulados, ErrorSimulacion> {
    for credito in creditos {
        validar_credito(credito)?;
    }
    if creditos.is_empty() {
        return Ok(PlanCreditosSimulados { escenarios: Vec::new() });
    }
    let deudas: Vec<DeudaPlan> = creditos.iter().map(deuda_desde_credito).collect();
    let escenarios = vec![
        escenario(DebtStrategy::Avalanche, &ordenar_por_tasa(deudas.clone()), extra_mensual),
        escenario(DebtStrategy::Snowball, &ordenar_por_saldo(deudas), extra_mensual),
    ];
    Ok(PlanCreditosSimulados { escenarios })
}
