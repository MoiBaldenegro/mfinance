//! Tests REQ-15-03 (1/2) del simulador multi-crédito: el orden de ataque
//! de avalancha (tasa desc) y bola de nieve (saldo asc) reutilizando el
//! motor del plan de deuda.

use super::simulador_fixtures::creditos;
use crate::application::simulador_creditos::estrategia::simular_plan_creditos;
use crate::domain::snapshot::DebtStrategy;

#[test]
fn orden_de_ataque_avalancha_por_tasa_y_bola_por_saldo() {
    let plan = simular_plan_creditos(&creditos(), 150.0).expect("plan válido");
    assert_eq!(plan.escenarios.len(), 2);

    let avalancha = plan
        .escenarios
        .iter()
        .find(|e| e.estrategia == DebtStrategy::Avalanche)
        .expect("escenario avalancha");
    assert_eq!(
        avalancha.orden_de_ataque,
        vec!["Prestamo A", "Prestamo B", "Credito C"]
    );
    assert_eq!(avalancha.deuda_objetivo.as_deref(), Some("Prestamo A"));

    let bola = plan
        .escenarios
        .iter()
        .find(|e| e.estrategia == DebtStrategy::Snowball)
        .expect("escenario bola de nieve");
    assert_eq!(
        bola.orden_de_ataque,
        vec!["Prestamo B", "Prestamo A", "Credito C"]
    );
    assert_eq!(bola.deuda_objetivo.as_deref(), Some("Prestamo B"));
}

#[test]
fn sin_creditos_devuelve_escenarios_vacios() {
    let plan = simular_plan_creditos(&[], 100.0).expect("plan vacío");
    assert!(plan.escenarios.is_empty());
}
