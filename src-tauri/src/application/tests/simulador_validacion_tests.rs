//! Tests REQ-15-05 del simulador: rechazo de peticiones inválidas
//! (importe no positivo, plazo cero, tasa negativa) con mensajes en español.

use crate::application::simulador_creditos::motor::amortizar;
use crate::application::simulador_creditos::validacion::validar_credito;
use crate::application::simulador_creditos::types::CreditoSimulado;

fn credito(importe: f64, plazo: u32, tasa: f64) -> CreditoSimulado {
    CreditoSimulado {
        nombre: "Crédito de prueba".to_string(),
        importe,
        plazo_meses: plazo,
        tasa_interes_anual: tasa,
    }
}

#[test]
fn plazo_cero_se_rechaza_con_mensaje_en_espanol() {
    let error = amortizar(10_000.0, 0, 5.0).expect_err("plazo cero debe fallar");
    assert_eq!(error.codigo(), "PlazoInvalidoError");
    assert!(error.to_string().contains("plazo"));
}

#[test]
fn tasa_negativa_se_rechaza_con_mensaje_en_espanol() {
    let error = amortizar(10_000.0, 12, -0.5).expect_err("tasa negativa debe fallar");
    assert_eq!(error.codigo(), "TasaNegativaError");
    assert!(error.to_string().contains("tasa"));
}

#[test]
fn importe_no_positivo_se_rechaza_con_mensaje_en_espanol() {
    let error = amortizar(0.0, 12, 5.0).expect_err("importe cero debe fallar");
    assert_eq!(error.codigo(), "ImporteInvalidoError");
    assert!(error.to_string().contains("importe"));

    let error_negativo = amortizar(-100.0, 12, 5.0).expect_err("importe negativo debe fallar");
    assert_eq!(error_negativo.codigo(), "ImporteInvalidoError");
}

#[test]
fn validar_credito_acepta_un_credito_valido_y_rechaza_los_invalidos() {
    assert!(validar_credito(&credito(1_000.0, 24, 7.5)).is_ok());
    assert!(validar_credito(&credito(0.0, 24, 7.5)).is_err());
    assert!(validar_credito(&credito(1_000.0, 0, 7.5)).is_err());
    assert!(validar_credito(&credito(1_000.0, 24, -1.0)).is_err());
}
