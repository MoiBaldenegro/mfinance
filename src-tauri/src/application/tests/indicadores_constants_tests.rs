//! Tests de las constantes de umbrales de los indicadores.

#[test]
fn constantes_umbrales_correctas() {
    use crate::application::indicadores_constants::*;
    assert_eq!(ENDEUDAMIENTO_VERDE_MAX, 15.0);
    assert_eq!(ENDEUDAMIENTO_ROJO_MIN, 30.0);
    assert_eq!(AHORRO_VERDE_MIN, 15.0);
    assert_eq!(AHORRO_ROJO_MAX, 5.0);
    assert_eq!(FONDO_VERDE_MIN, 3.0);
    assert_eq!(FONDO_ROJO_MAX, 1.0);
    assert_eq!(INGRESO_PASIVO_VERDE_MIN, 100.0);
    assert_eq!(INGRESO_PASIVO_ROJO_MAX, 25.0);
}