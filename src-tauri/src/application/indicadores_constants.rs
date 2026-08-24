//! Umbrales del semáforo como constantes de dominio (REQ-10-02..05).
//! Definidas aquí para ser testeables y no hardcodeadas en componentes.

/// Endeudamiento: < 15% verde, 15-30% amarillo, > 30% rojo
pub const ENDEUDAMIENTO_VERDE_MAX: f64 = 15.0;
pub const ENDEUDAMIENTO_ROJO_MIN: f64 = 30.0;

/// Tasa de ahorro: > 15% verde, 5-15% amarillo, < 5% rojo
pub const AHORRO_VERDE_MIN: f64 = 15.0;
pub const AHORRO_ROJO_MAX: f64 = 5.0;

/// Fondo de emergencia: ≥ 3 meses verde, 1-<3 amarillo, < 1 rojo
pub const FONDO_VERDE_MIN: f64 = 3.0;
pub const FONDO_ROJO_MAX: f64 = 1.0;

/// Ingreso pasivo: ≥ 100% verde, 25-<100% amarillo, < 25% rojo
pub const INGRESO_PASIVO_VERDE_MIN: f64 = 100.0;
pub const INGRESO_PASIVO_ROJO_MAX: f64 = 25.0;