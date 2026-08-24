//! Lectura y escritura atómica de JSON (REQ-04-03): se serializa
//! completo en memoria y se publica con tmp + rename, de modo que en
//! disco siempre queda JSON válido.

use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

use crate::domain::snapshot::FinanceSnapshot;

/// Lee y deserializa el snapshot de `path`; motivo legible si falla.
pub fn read(path: &Path) -> Result<FinanceSnapshot, String> {
    let raw = fs::read_to_string(path)
        .map_err(|error| format!("no se pudo leer {}: {error}", path.display()))?;
    serde_json::from_str(&raw).map_err(|error| {
        format!("{} no es un snapshot válido: {error}", path.display())
    })
}

/// Serializa pretty cualquier valor serde y lo escribe de forma atómica
/// (REQ-04-03): primero a un `.tmp` hermano y después rename.
pub fn write_atomic<T: Serialize>(
    path: &Path,
    valor: &T,
) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            format!("no se pudo crear {}: {error}", parent.display())
        })?;
    }
    let contents = serde_json::to_string_pretty(valor)
        .map_err(|error| format!("valor no serializable: {error}"))?;
    let tmp = sibling_tmp(path);
    fs::write(&tmp, contents).map_err(|error| {
        format!("no se pudo escribir el temporal {}: {error}", tmp.display())
    })?;
    fs::rename(&tmp, path).map_err(|error| {
        format!("no se pudo publicar {}: {error}", path.display())
    })
}

/// Ruta del temporal hermano del archivo final (`mfinance.json.tmp`).
fn sibling_tmp(path: &Path) -> PathBuf {
    let name = path.file_name().map_or_else(
        || "mfinance.json".to_string(),
        |name| name.to_string_lossy().to_string(),
    );
    path.with_file_name(format!("{name}.tmp"))
}
