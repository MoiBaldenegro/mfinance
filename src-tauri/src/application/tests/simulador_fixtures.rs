//! Fixture compartido de los tests del simulador multi-crédito (REQ-15-03):
//! tres créditos hipotéticos con tasas y saldos que no correlacionan.

use crate::application::simulador_creditos::types::CreditoSimulado;

/// Créditos de prueba: A(5.000 € 36m 18%) B(1.000 € 12m 6%) C(10.000 € 48m 3%).
pub fn creditos() -> Vec<CreditoSimulado> {
    vec![
        CreditoSimulado {
            nombre: "Prestamo A".to_string(),
            importe: 5_000.0,
            plazo_meses: 36,
            tasa_interes_anual: 18.0,
        },
        CreditoSimulado {
            nombre: "Prestamo B".to_string(),
            importe: 1_000.0,
            plazo_meses: 12,
            tasa_interes_anual: 6.0,
        },
        CreditoSimulado {
            nombre: "Credito C".to_string(),
            importe: 10_000.0,
            plazo_meses: 48,
            tasa_interes_anual: 3.0,
        },
    ]
}
