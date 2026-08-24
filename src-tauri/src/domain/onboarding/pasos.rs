//! REQ-23-02: tipos de los pasos 3 y 4 del wizard de onboarding.

use serde::{Deserialize, Serialize};

/// Paso 3: estrategia de deuda, pago extra, supuestos proyección.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct Paso3Data {
    /// Estrategia preferida: "avalancha" | "bola_de_nieve".
    pub estrategia_deuda: Option<String>,
    /// Pago extra mensual.
    pub pago_extra_mensual: Option<f64>,
    /// Supuestos de proyección por variable (%).
    pub supuestos_proyeccion: Vec<SupuestoProyeccion>,
}

/// Un supuesto de proyección (% por variable).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SupuestoProyeccion {
    pub variable: String,
    pub porcentaje: f64, // -50.0 a +100.0
}

/// Paso 4: umbrales de indicadores personalizados.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct Paso4Data {
    pub umbrales: UmbralesIndicadores,
}

/// Umbrales de los 4 indicadores (verde/rojo).
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct UmbralesIndicadores {
    /// Endeudamiento: verde < X%, rojo > Y%.
    pub endeudamiento_verde: Option<f64>,
    pub endeudamiento_rojo: Option<f64>,
    /// Tasa ahorro: verde > X%, rojo < Y%.
    pub ahorro_verde: Option<f64>,
    pub ahorro_rojo: Option<f64>,
    /// Fondo emergencia: verde >= X meses, rojo < Y meses.
    pub fondo_verde: Option<f64>,
    pub fondo_rojo: Option<f64>,
    /// Ingreso pasivo: verde >= X%, amarillo >= Y%.
    pub ingreso_pasivo_verde: Option<f64>,
    pub ingreso_pasivo_amarillo: Option<f64>,
}