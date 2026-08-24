//! REQ-23-04: perfil financiero consolidado tras completar onboarding.

use serde::{Deserialize, Serialize};

use crate::domain::onboarding::UmbralesIndicadores;

/// Perfil financiero estructurado consolidado al completar onboarding (REQ-23-04).
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct FinancialProfile {
    /// Fuentes de ingreso activas del catálogo.
    pub fuentes_ingreso_activas: Vec<String>,
    /// Categorías de gasto usadas del catálogo.
    pub categorias_gasto_usadas: Vec<String>,
    /// Estrategia de deuda preferida.
    pub estrategia_deuda_preferida: Option<String>,
    /// Pago extra mensual dedicado a deuda objetivo.
    pub pago_extra_mensual: Option<f64>,
    /// Familias de inversión activas con sus tasas esperadas.
    pub familias_inversion_activas: Vec<FamiliaInversionActiva>,
    /// Umbrales personalizados de indicadores.
    pub umbrales_indicadores: UmbralesIndicadores,
}

/// Familia de inversión activa con tasa esperada.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FamiliaInversionActiva {
    pub familia: String,
    pub tasa_esperada_anual: f64,
}