//! Handlers #[tauri::command] FINOS del diagnóstico PDF (REQ-12-07/09):
//! subida múltiple, análisis del lote y confirmación. Delegan en
//! application/diagnostico/ sin lógica de negocio ni fs directo; solo
//! decodifican el transporte base64 (design.md F12).

use serde::Deserialize;
use tauri::State;

use crate::application::diagnostico::{
    analizar_lote, confirmar_movimientos, subir_comprobantes,
};
use crate::commands::error::CommandError;
use crate::commands::AppState;
use crate::domain::comprobante_pdf::ResultadoLote;
use crate::domain::snapshot::FinanceSnapshot;
use crate::infrastructure::base64_min;

/// Archivo subido desde el frontend: nombre original + bytes en base64.
#[derive(Deserialize)]
pub struct ArchivoSubidoDto {
    pub nombre: String,
    pub contenido_base64: String,
}

fn decodificar_archivo(
    archivo: &ArchivoSubidoDto,
) -> Result<(String, Vec<u8>), CommandError> {
    let bytes = base64_min::decodificar(&archivo.contenido_base64).map_err(
        |motivo| {
            CommandError::validacion(&format!(
                "\"{}\": base64 inválido ({motivo})",
                archivo.nombre
            ))
        },
    )?;
    Ok((archivo.nombre.clone(), bytes))
}

/// REQ-12-04/05: guarda uno o varios PDFs asociados al mes seleccionado.
#[tauri::command]
pub fn subir_comprobantes_cmd(
    mes: String,
    archivos: Vec<ArchivoSubidoDto>,
    state: State<AppState>,
) -> Result<Vec<String>, CommandError> {
    let entradas: Result<Vec<_>, _> =
        archivos.iter().map(decodificar_archivo).collect();
    let mut comprobantes = state.comprobantes.lock().map_err(|_| {
        CommandError::interno("los comprobantes están bloqueados")
    })?;
    subir_comprobantes(&mut *comprobantes, &mes, &entradas?)
        .map_err(CommandError::from)
}

/// REQ-12-06/13/14/15/16: analiza los PDFs del mes y devuelve el informe.
#[tauri::command]
pub fn diagnosticar_comprobantes_cmd(
    mes: String,
    state: State<AppState>,
) -> Result<ResultadoLote, CommandError> {
    let comprobantes = state.comprobantes.lock().map_err(|_| {
        CommandError::interno("los comprobantes están bloqueados")
    })?;
    analizar_lote(&*comprobantes, &state.extractor, &mes)
        .map_err(CommandError::from)
}

/// REQ-12-10/11/12: incorpora los movimientos confirmados al mes y persiste.
#[tauri::command]
pub fn confirmar_diagnostico_cmd(
    mes: String,
    aceptados: Vec<crate::application::diagnostico::MovimientoAceptado>,
    state: State<AppState>,
) -> Result<FinanceSnapshot, CommandError> {
    let mut repo = state.repo.lock().map_err(|_| {
        CommandError::interno("el estado está bloqueado por otra operación")
    })?;
    confirmar_movimientos(&mut *repo, &mes, &aceptados)
        .map_err(CommandError::from)
}
