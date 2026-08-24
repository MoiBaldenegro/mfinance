//! REQ-23-01: estado del onboarding del perfil.

use serde::{Deserialize, Serialize};

/// Estado del onboarding del perfil (REQ-23-01).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum OnboardingStatus {
    NotStarted,
    InProgress { current_step: u8 },
    Completed,
}

impl Default for OnboardingStatus {
    fn default() -> Self {
        Self::NotStarted
    }
}