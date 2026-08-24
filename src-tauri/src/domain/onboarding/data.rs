//! REQ-23-02: datos parciales del wizard de onboarding.

use serde::{Deserialize, Serialize};

use crate::domain::currency::Currency;
use crate::domain::onboarding::pasos::{Paso3Data, Paso4Data};

/// Datos parciales capturados durante el wizard de onboarding (REQ-23-02).
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct OnboardingData {
    /// Paso 1: datos personales y configuración base.
    pub paso1: Option<Paso1Data>,
    /// Paso 2: balance inicial (activos, pasivos, inversiones).
    pub paso2: Option<Paso2Data>,
    /// Paso 3: deuda y proyección.
    pub paso3: Option<Paso3Data>,
    /// Paso 4: umbrales indicadores.
    pub paso4: Option<Paso4Data>,
}

/// Paso 1: datos personales, moneda, fuentes ingreso, categorías gasto.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Paso1Data {
    /// Nombre completo del titular.
    pub nombre_completo: String,
    /// Moneda de visualización.
    pub moneda: Currency,
    /// Fuentes de ingreso activas (claves del catálogo).
    pub fuentes_ingreso_activas: Vec<String>,
    /// Categorías de gasto usadas (claves del catálogo).
    pub categorias_gasto_usadas: Vec<String>,
}

/// Paso 2: balance inicial.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct Paso2Data {
    /// Activos iniciales.
    pub activos: Vec<OnboardingActivo>,
    /// Pasivos iniciales.
    pub pasivos: Vec<OnboardingPasivo>,
    /// Inversiones iniciales por familia.
    pub inversiones: Vec<OnboardingInversion>,
}

/// Activo para onboarding (simplificado).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct OnboardingActivo {
    pub nombre: String,
    pub categoria: String, // "liquido" | "inversion" | "propiedad"
    pub valor_actual: f64,
}

/// Pasivo para onboarding (simplificado).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct OnboardingPasivo {
    pub nombre: String,
    pub saldo_pendiente: f64,
    pub tasa_interes_anual: f64,
}

/// Inversión para onboarding (simplificado).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct OnboardingInversion {
    pub familia: String, // "renta_fija" | "renta_variable" | "finca_raiz"
    pub aporte_mensual: f64,
    pub valor_actual: f64,
    pub tasa_esperada_anual: f64,
}