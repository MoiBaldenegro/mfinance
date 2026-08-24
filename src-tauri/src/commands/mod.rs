//! Capa de entrada: handlers #[tauri::command] FINOS (REQ-04-08) que
//! delegan en application/ sin lógica de negocio ni fs directo, más el
//! estado gestionado inyectado desde el composition root.

pub mod error;
pub mod error_conciliacion;
pub mod error_cierre;
pub mod error_diagnostico;
pub mod goals_commands;
pub mod perfiles_commands;
pub mod perfiles_onboarding_commands;
#[cfg(test)]
pub mod perfiles_onboarding_commands_tests;
#[cfg(test)]
pub mod perfiles_onboarding_ruta_tests;
pub mod obtener_perfil_activo_con_onboarding_commands;
pub mod snapshot_commands;
pub mod pyg_commands;
pub mod balance_commands;
pub mod plan_deuda_commands;
pub mod indicadores_commands;
pub mod inversiones_commands;
pub mod conciliacion_commands;
pub mod pyg_proyeccion_commands;
pub mod simulador_commands;
pub mod cierre_commands;
pub mod diagnostico_commands;

use std::sync::Mutex;

use crate::infrastructure::json_repository::JsonSnapshotRepository;
use crate::infrastructure::comprobantes_fs::ComprobantesFsRepository;
use crate::infrastructure::pdf_extractor::ExtractorPdfExtract;

/// Contenedor del adapter concreto; los handlers solo lo usan como
/// fuente del puerto (`&dyn` / `&mut dyn SnapshotRepository`).
pub struct AppState {
    pub repo: Mutex<JsonSnapshotRepository>,
    /// Almacén de comprobantes PDF (feature 12) y su extractor.
    pub comprobantes: Mutex<ComprobantesFsRepository>,
    pub extractor: ExtractorPdfExtract,
}