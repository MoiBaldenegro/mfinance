//! REQ-12-05 + REQ-21-07: adapter fs del puerto ComprobantesStore. Los
//! PDFs viven en `<base>/<perfilId>/<YYYY-MM>/<nombre original>` para
//! que cada perfil tenga sus comprobantes aislados. La base se inyecta
//! desde lib.rs (Documents/mfinance/comprobantes) y el perfil se fija
//! por sesión (`set_perfil`); los tests usan directorios temporales.

use std::path::PathBuf;

use crate::domain::month_key::MonthKey;
use crate::domain::puertos_pdf::{ComprobantesStore, ComprobantesStoreError};
use crate::infrastructure::pdf_nombre::nombre_seguro;

const SIN_PERFIL: &str = "sin perfil activo configurado para comprobantes";

/// Adapter de almacenamiento de comprobantes sobre el filesystem.
pub struct ComprobantesFsRepository {
    base: PathBuf,
    perfil: Option<String>,
}

impl ComprobantesFsRepository {
    /// Construye el adapter con la carpeta base inyectada.
    pub fn new(base: PathBuf) -> Self {
        Self { base, perfil: None }
    }

    /// Fija el perfil dueño de los comprobantes (sesión activa).
    pub fn set_perfil(&mut self, perfil: String) {
        self.perfil = Some(perfil);
    }

    fn carpeta_del_mes(&self, mes: &str) -> Result<PathBuf, ComprobantesStoreError> {
        let perfil = self.perfil.as_deref().ok_or_else(|| {
            ComprobantesStoreError::nuevo(SIN_PERFIL)
        })?;
        let clave = MonthKey::parse(mes).map_err(|_| {
            ComprobantesStoreError::nuevo(&format!("mes inválido: \"{mes}\""))
        })?;
        Ok(self.base.join(perfil).join(clave.as_str()))
    }
}

impl ComprobantesStore for ComprobantesFsRepository {
    fn guardar(
        &mut self,
        mes: &str,
        nombre_original: &str,
        bytes: &[u8],
    ) -> Result<String, ComprobantesStoreError> {
        let carpeta = self.carpeta_del_mes(mes)?;
        let nombre = nombre_seguro(nombre_original);
        std::fs::create_dir_all(&carpeta).map_err(|e| {
            ComprobantesStoreError::nuevo(&format!(
                "no se pudo crear {}: {e}",
                carpeta.display()
            ))
        })?;
        std::fs::write(carpeta.join(&nombre), bytes).map_err(|e| {
            ComprobantesStoreError::nuevo(&format!(
                "no se pudo escribir \"{nombre}\": {e}"
            ))
        })?;
        Ok(nombre)
    }

    fn listar(&self, mes: &str) -> Result<Vec<String>, ComprobantesStoreError> {
        let carpeta = self.carpeta_del_mes(mes)?;
        if !carpeta.is_dir() {
            return Ok(Vec::new());
        }
        let mut nombres: Vec<String> = std::fs::read_dir(&carpeta)
            .map_err(|e| {
                ComprobantesStoreError::nuevo(&format!(
                    "no se pudo listar {}: {e}",
                    carpeta.display()
                ))
            })?
            .filter_map(Result::ok)
            .map(|entrada| entrada.file_name().to_string_lossy().into_owned())
            .filter(|n| n.to_lowercase().ends_with(".pdf"))
            .collect();
        nombres.sort();
        Ok(nombres)
    }

    fn leer(
        &self,
        mes: &str,
        nombre: &str,
    ) -> Result<Vec<u8>, ComprobantesStoreError> {
        let ruta = self.carpeta_del_mes(mes)?.join(nombre_seguro(nombre));
        std::fs::read(&ruta).map_err(|e| {
            ComprobantesStoreError::nuevo(&format!(
                "no se pudo leer \"{}\": {e}",
                ruta.display()
            ))
        })
    }
}
