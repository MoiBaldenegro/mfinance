//! REQ-23-03, REQ-23-11: journal de metas (GoalEntry) y su validación.

use serde::{Deserialize, Serialize};

use crate::domain::tiempo;
use crate::domain::errors::GoalEntryError;

/// Entrada del journal de metas (REQ-23-03).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GoalEntry {
    /// Identificador único de la meta (generado al crear).
    pub id: String,
    /// Título de la meta (req, ≤100).
    pub titulo: String,
    /// Descripción libre (≤5000).
    pub descripcion: String,
    /// Tags asociados (≤5, cada uno ≤20, no vacíos).
    pub tags: Vec<String>,
    /// Fecha de creación ISO-8601 UTC.
    pub creado_en: String,
}

impl GoalEntry {
    /// Crea una nueva GoalEntry validando todas las reglas (REQ-23-11).
    pub fn nueva(
        titulo: String,
        descripcion: String,
        tags: Vec<String>,
    ) -> Result<Self, GoalEntryError> {
        let titulo = titulo.trim().to_string();
        if titulo.is_empty() {
            return Err(GoalEntryError::TituloVacio);
        }
        if titulo.len() > 100 {
            return Err(GoalEntryError::TituloMuyLargo(titulo.len()));
        }

        if descripcion.len() > 5000 {
            return Err(GoalEntryError::DescripcionMuyLarga(descripcion.len()));
        }

        if tags.len() > 5 {
            return Err(GoalEntryError::DemasiadosTags(tags.len()));
        }

        for (idx, tag) in tags.iter().enumerate() {
            let tag = tag.trim();
            if tag.is_empty() {
                return Err(GoalEntryError::TagVacio(idx));
            }
            if tag.len() > 20 {
                return Err(GoalEntryError::TagMuyLargo(idx));
            }
        }

        Ok(Self {
            id: nuevo_goal_id(),
            titulo,
            descripcion,
            tags: tags.into_iter().map(|t| t.trim().to_string()).collect(),
            creado_en: tiempo::ahora_iso(),
        })
    }
}

/// Genera un id único para GoalEntry con Rust stdlib.
fn nuevo_goal_id() -> String {
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};

    static SECUENCIA_GOAL: AtomicU64 = AtomicU64::new(0);
    let n = SECUENCIA_GOAL.fetch_add(1, Ordering::SeqCst);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(0);
    format!("g_{nanos:012x}{n:06x}")
}