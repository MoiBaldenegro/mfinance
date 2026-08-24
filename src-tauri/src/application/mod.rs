//! Casos de uso que orquestan el dominio a través del puerto
//! SnapshotRepository: un caso de uso por archivo, sin fs ni IPC.

pub mod balance_serie;
pub mod balance_crud;
pub mod balance_crud_error;
pub mod arranque_perfiles;
pub mod cierre;
pub mod conciliacion;
pub mod conciliacion_engine;
pub mod conciliacion_historico;
pub mod conciliacion_types;
pub mod diagnostico;
pub mod ensure_seed;
pub mod entity_validation;
pub mod export_json;
pub mod import_json;
pub mod import_validation;
pub mod indicadores_constants;
pub mod indicadores_engine;
pub mod indicadores_fachada;
pub mod indicadores_types;
pub mod inversiones_proyeccion;
pub mod load_state;
pub mod obtener_perfil_activo_con_onboarding;
pub mod perfiles;
pub mod perfiles_onboarding;
pub mod plan_deuda;
pub mod plan_deuda_simulacion;
pub mod pyg_proyeccion;
pub mod pyg_serie;
pub mod record_validation;
pub mod recuperacion_arranque;
pub mod save_state;
pub mod simulador_creditos;

#[cfg(test)]
pub mod tests;