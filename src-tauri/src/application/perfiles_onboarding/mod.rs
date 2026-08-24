//! Casos de uso para onboarding de perfiles (REQ-23-07 a 23-09, REQ-23-11).
//! Orquestan el puerto PerfilRepository con validaciones; sin filesystem ni IPC.

pub mod actualizar;
pub mod completar;
pub mod consolidar_snapshot;
pub mod finalizar;
pub mod goals;
pub mod status;

pub use actualizar::actualizar_onboarding;
pub use completar::completar_onboarding;
pub use consolidar_snapshot::{aplicar_onboarding_a_snapshot, completar_onboarding_con_snapshot};
pub use finalizar::completar_onboarding_en_adaptador;
pub use goals::{agregar_goal, actualizar_goal, eliminar_goal};
pub use status::obtener_onboarding_status;