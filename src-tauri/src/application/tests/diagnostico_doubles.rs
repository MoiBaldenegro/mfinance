//! Doble del puerto ComprobantesStore: almacén en memoria con fallos
//! inyectables y fábrica de lote de tres comprobantes para los tests de
//! analizar_lote (flujo normal y fallos aislados por archivo).

use std::collections::BTreeMap;

use crate::domain::puertos_pdf::{ComprobantesStore, ComprobantesStoreError};

/// Almacén falso: mes → [(nombre, bytes)].
#[derive(Default)]
pub struct AlmacenFalso {
    pub datos: BTreeMap<String, Vec<(String, Vec<u8>)>>,
    pub fallir_guardar: bool,
    pub fallir_leer: bool,
}

impl ComprobantesStore for AlmacenFalso {
    fn guardar(
        &mut self,
        mes: &str,
        nombre_original: &str,
        bytes: &[u8],
    ) -> Result<String, ComprobantesStoreError> {
        if self.fallir_guardar {
            return Err(ComprobantesStoreError::nuevo("fallo inyectado"));
        }
        self.datos
            .entry(mes.to_string())
            .or_default()
            .push((nombre_original.to_string(), bytes.to_vec()));
        Ok(nombre_original.to_string())
    }

    fn listar(&self, mes: &str) -> Result<Vec<String>, ComprobantesStoreError> {
        Ok(self
            .datos
            .get(mes)
            .map(|lista| lista.iter().map(|(n, _)| n.clone()).collect())
            .unwrap_or_default())
    }

    fn leer(
        &self,
        mes: &str,
        nombre: &str,
    ) -> Result<Vec<u8>, ComprobantesStoreError> {
        if self.fallir_leer {
            return Err(ComprobantesStoreError::nuevo("fallo inyectado al leer"));
        }
        self.datos
            .get(mes)
            .and_then(|lista| {
                lista.iter().find(|(n, _)| n == nombre).map(|(_, b)| b.clone())
            })
            .ok_or_else(|| {
                ComprobantesStoreError::nuevo("comprobante inexistente")
            })
    }
}

/// Lote de tres comprobantes del mes 2026-06: bueno.pdf, malo.pdf y
/// otro.pdf (orden alfabético), usado por los suites del lote.
pub fn almacen_con_tres() -> AlmacenFalso {
    let mut store = AlmacenFalso::default();
    store.datos.insert(
        "2026-06".to_string(),
        vec![
            ("bueno.pdf".to_string(), b"%PDF-1.4 ok".to_vec()),
            ("malo.pdf".to_string(), b"basura".to_vec()),
            ("otro.pdf".to_string(), b"%PDF-1.4 otro".to_vec()),
        ],
    );
    store
}
