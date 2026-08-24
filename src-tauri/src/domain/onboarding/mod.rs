//! REQ-23-01 a 23-04: tipos del modelo de onboarding extendido.
//! Sin dependencias externas; dominio puro testeable con cargo test.

pub mod data;
pub mod financial_profile;
pub mod goal_entry;
pub mod pasos;
pub mod status;

pub use data::{
    OnboardingData, OnboardingActivo, OnboardingPasivo, OnboardingInversion,
    Paso1Data, Paso2Data,
};
pub use financial_profile::{FinancialProfile, FamiliaInversionActiva};
pub use goal_entry::GoalEntry;
pub use pasos::{Paso3Data, Paso4Data, SupuestoProyeccion, UmbralesIndicadores};
pub use status::OnboardingStatus;