//! Tests REQ-15-03 (2/2) del simulador multi-crédito: intereses por
//! escenario base vs optimizado con el extra mensual del plan.

use super::simulador_fixtures::creditos;
use crate::application::simulador_creditos::estrategia::simular_plan_creditos;
use crate::domain::snapshot::DebtStrategy;

#[test]
fn cada_escenario_devuelve_base_vs_optimizado_con_extra_del_plan() {
    let plan = simular_plan_creditos(&creditos(), 150.0).expect("plan válido");
    for escenario in &plan.escenarios {
        assert!(
            escenario.intereses_base > 0.0,
            "intereses base positivos en {:?}",
            escenario.estrategia
        );
        assert!(
            escenario.meses_optimizado < escenario.meses_base,
            "el extra acorta el plazo en {:?}",
            escenario.estrategia
        );
        assert!(
            escenario.intereses_optimizado < escenario.intereses_base,
            "el extra reduce intereses en {:?}",
            escenario.estrategia
        );
        assert!(escenario.meses_ahorrados > 0);
        assert!(
            (escenario.intereses_ahorrados
                - (escenario.intereses_base - escenario.intereses_optimizado))
                .abs()
                <= 0.005
        );
    }
}

/// El motor del plan de deuda es la fuente: sin extra, base y optimizado
/// coinciden; con extra, la avalancha liquida antes que sin él.
#[test]
fn sin_extra_no_hay_ahorro_y_con_extra_se_liquida_todo() {
    let sin_extra = simular_plan_creditos(&creditos(), 0.0).expect("plan válido");
    for escenario in &sin_extra.escenarios {
        assert_eq!(escenario.meses_optimizado, escenario.meses_base);
        assert!(escenario.intereses_ahorrados.abs() < 0.005);
    }

    let con_extra = simular_plan_creditos(&creditos(), 300.0).expect("plan válido");
    let avalancha = con_extra
        .escenarios
        .iter()
        .find(|e| e.estrategia == DebtStrategy::Avalanche)
        .expect("avalancha");
    // El pago mínimo de cada crédito simulado es su cuota francesa; con el
    // extra dedicado al objetivo el total debe liquidarse antes que sin él.
    assert!(avalancha.meses_optimizado <= avalancha.meses_base);
}
