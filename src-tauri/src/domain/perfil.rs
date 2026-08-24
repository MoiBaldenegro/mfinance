//! REQ-21-01, REQ-23-01 a 23-04: entidad Perfil extendida con onboarding.
//! Ids únicos generados con Rust stdlib: nada de crates.

use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::domain::onboarding::{
    FinancialProfile, GoalEntry, OnboardingData, OnboardingStatus,
};
use crate::domain::tiempo;

/// Contador por proceso: garantiza unicidad aunque el reloj del sistema
/// tenga granularidad gruesa; la marca de tiempo aporta unicidad entre
/// procesos y el prefijo documenta el esquema (`p_<hex>`).
static SECUENCIA: AtomicU64 = AtomicU64::new(0);

/// Genera un id único con Rust stdlib (REQ-21-06, sin crate uuid).
pub fn nuevo_id() -> String {
    let n = SECUENCIA.fetch_add(1, Ordering::SeqCst);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(0);
    format!("p_{nanos:012x}{n:06x}")
}

/// Un perfil de titular: identidad propia con datos aislados y onboarding.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Perfil {
    /// Identificador único con esquema `p_<hex>`.
    pub id: String,
    /// Nombre visible del titular.
    pub nombre: String,
    /// Fecha de creación en ISO-8601 UTC.
    pub creado_en: String,
    /// Estado del onboarding (REQ-23-01). Default Completed para migración legacy.
    #[serde(default = "onboarding_status_completed_default")]
    pub onboarding_status: OnboardingStatus,
    /// Datos parciales del wizard de onboarding (REQ-23-02).
    #[serde(default)]
    pub onboarding_data: OnboardingData,
    /// Journal de metas del titular (REQ-23-03).
    #[serde(default)]
    pub goals_journal: Vec<GoalEntry>,
    /// Perfil financiero consolidado (REQ-23-04).
    #[serde(default)]
    pub financial_profile: FinancialProfile,
}

fn onboarding_status_completed_default() -> OnboardingStatus {
    OnboardingStatus::Completed
}

impl Perfil {
    /// Perfil nuevo: id único y fecha de creación del momento actual.
    /// Onboarding empieza en NotStarted (REQ-23-10: legacy migra a Completed).
    pub fn nuevo(nombre: &str) -> Self {
        Self {
            id: nuevo_id(),
            nombre: nombre.to_string(),
            creado_en: tiempo::ahora_iso(),
            onboarding_status: OnboardingStatus::NotStarted,
            onboarding_data: OnboardingData::default(),
            goals_journal: Vec::new(),
            financial_profile: FinancialProfile::default(),
        }
    }

    /// Perfil legacy migrado: onboarding_status = Completed, resto defaults.
    pub fn legacy_migrado(nombre: &str) -> Self {
        Self {
            id: nuevo_id(),
            nombre: nombre.to_string(),
            creado_en: tiempo::ahora_iso(),
            onboarding_status: OnboardingStatus::Completed,
            onboarding_data: OnboardingData::default(),
            goals_journal: Vec::new(),
            financial_profile: FinancialProfile::default(),
        }
    }
}
