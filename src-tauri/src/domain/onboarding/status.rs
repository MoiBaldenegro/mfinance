//! REQ-23-01: estado del onboarding del perfil.

use serde::de::Error as DeError;
use serde::ser::SerializeStruct;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde_json::Value;

/// Estado del onboarding del perfil (REQ-23-01).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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

impl Serialize for OnboardingStatus {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let fields = if matches!(self, Self::InProgress { .. }) { 2 } else { 1 };
        let mut object = serializer.serialize_struct("OnboardingStatus", fields)?;
        match self {
            Self::NotStarted => object.serialize_field("nombre", "NotStarted")?,
            Self::Completed => object.serialize_field("nombre", "Completed")?,
            Self::InProgress { current_step } => {
                object.serialize_field("nombre", "InProgress")?;
                object.serialize_field("current_step", current_step)?;
            }
        }
        object.end()
    }
}

impl<'de> Deserialize<'de> for OnboardingStatus {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        match Value::deserialize(deserializer)? {
            Value::String(name) => parse_name::<D::Error>(&name, None),
            Value::Object(mut object) => {
                if let Some(name) = object.remove("nombre") {
                    let name = name.as_str().ok_or_else(|| D::Error::custom(
                        "onboarding_status.nombre debe ser texto",
                    ))?;
                    return parse_name::<D::Error>(
                        name,
                        object.remove("current_step"),
                    );
                }
                if let Some(Value::Object(mut progress)) = object.remove("InProgress") {
                    return parse_name::<D::Error>(
                        "InProgress",
                        progress.remove("current_step"),
                    );
                }
                Err(D::Error::custom("formato de onboarding_status inválido"))
            }
            _ => Err(D::Error::custom("formato de onboarding_status inválido")),
        }
    }
}

fn parse_name<E: DeError>(name: &str, step: Option<Value>) -> Result<OnboardingStatus, E> {
    match name {
        "NotStarted" => Ok(OnboardingStatus::NotStarted),
        "Completed" => Ok(OnboardingStatus::Completed),
        "InProgress" => {
            let step = step
                .and_then(|value| value.as_u64())
                .and_then(|value| u8::try_from(value).ok())
                .ok_or_else(|| E::custom("onboarding_status.current_step inválido"))?;
            Ok(OnboardingStatus::InProgress { current_step: step })
        }
        _ => Err(E::custom("nombre de onboarding_status desconocido")),
    }
}
