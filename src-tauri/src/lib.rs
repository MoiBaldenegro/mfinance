// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod application;
pub mod commands;
pub mod domain;
mod infrastructure;
mod seed;

use std::path::PathBuf;
use tauri::Manager;

use commands::snapshot_commands::{load_state, save_state, export_json, import_json};
use commands::perfiles_commands::{crear_perfil, listar_perfiles, perfil_activo, seleccionar_perfil};
use commands::goals_commands::{actualizar_meta, agregar_meta, eliminar_meta};
use commands::perfiles_onboarding_commands::{actualizar_perfil_onboarding, completar_onboarding, obtener_onboarding_status};
use commands::obtener_perfil_activo_con_onboarding_commands::obtener_perfil_activo_con_onboarding;
use commands::pyg_commands::pyg_serie;
use commands::balance_commands::{asset_eliminar, asset_upsert, balance_serie, liability_eliminar, liability_upsert};
use commands::plan_deuda_commands::plan_deuda;
use commands::indicadores_commands::indicadores;
use commands::inversiones_commands::inversiones_proyeccion_cmd;
use commands::conciliacion_commands::{conciliacion_mensual_cmd, conciliacion_agregar_movimiento, conciliacion_historico_cmd};
use commands::pyg_proyeccion_commands::{pyg_proyeccion, balance_futuro};
use commands::simulador_commands::{simular_credito, simular_plan_creditos_cmd};
use commands::cierre_commands::{cierre_resumen_cmd, cierre_confirmar_cmd, cierre_reabrir_cmd, consejos_cmd};
use commands::diagnostico_commands::{subir_comprobantes_cmd, diagnosticar_comprobantes_cmd, confirmar_diagnostico_cmd};
use infrastructure::comprobantes_fs::ComprobantesFsRepository;
use infrastructure::json_repository::JsonSnapshotRepository;
use infrastructure::pdf_extractor::ExtractorPdfExtract;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Estado gestionado: perfiles/migración/seed (REQ-21-04/05) más
/// comprobantes bajo la carpeta del perfil activo (REQ-21-07).
fn estado_inicial(base: PathBuf) -> Result<commands::AppState, String> {
    let mut repo = JsonSnapshotRepository::new(base.clone());
    application::arranque_perfiles::preparar_arranque(&mut repo)
        .map_err(|error| error.to_string())?;
    let mut comprobantes =
        ComprobantesFsRepository::new(base.join("comprobantes"));
    if let Some(activo) = repo.activo() {
        comprobantes.set_perfil(activo.to_string());
    }
    Ok(commands::AppState {
        repo: std::sync::Mutex::new(repo),
        comprobantes: std::sync::Mutex::new(comprobantes),
        extractor: ExtractorPdfExtract,
    })
}

/// Composition root: resuelve Documents con `tauri::path` (sin rutas
/// hardcodeadas), construye el adapter con arranque de perfiles y
/// registra todos los commands.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let base = app.path().document_dir()?.join("mfinance");
            app.manage(estado_inicial(base)?);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            load_state,
            save_state,
            export_json,
            import_json,
            listar_perfiles,
            perfil_activo,
            crear_perfil,
            seleccionar_perfil,
            actualizar_perfil_onboarding,
            completar_onboarding,
            obtener_onboarding_status,
            obtener_perfil_activo_con_onboarding,
            agregar_meta, actualizar_meta, eliminar_meta,
            pyg_serie,
            balance_serie,
            asset_upsert, asset_eliminar, liability_upsert, liability_eliminar,
            plan_deuda,
            indicadores,
            inversiones_proyeccion_cmd,
            conciliacion_mensual_cmd,
            conciliacion_agregar_movimiento,
            conciliacion_historico_cmd,
            pyg_proyeccion,
            balance_futuro,
            simular_credito,
            simular_plan_creditos_cmd,
            cierre_resumen_cmd,
            cierre_confirmar_cmd,
            cierre_reabrir_cmd,
            consejos_cmd,
            subir_comprobantes_cmd,
            diagnosticar_comprobantes_cmd,
            confirmar_diagnostico_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
