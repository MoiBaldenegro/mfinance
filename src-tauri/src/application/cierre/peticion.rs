//! Petición de confirmación del wizard (REQ-16-03): mes a cerrar y las
//! decisiones tomadas (presupuesto fijado para el mes siguiente).

use std::collections::BTreeMap;

use serde::Deserialize;

use crate::domain::catalogs::ExpenseCategory;

/// Petición del paso Confirmación hacia el command de cierre.
#[derive(Debug, Clone, Deserialize)]
pub struct PeticionCierre {
    /// Mes a cerrar (YYYY-MM).
    pub mes: String,
    /// Presupuesto decidido para el mes siguiente por categoría.
    pub presupuesto_siguiente: BTreeMap<ExpenseCategory, f64>,
}

impl PeticionCierre {
    /// Petición desde pares crudos (para tests y commands finos).
    pub fn desde_pares(
        mes: &str,
        pares: &[(&str, f64)],
    ) -> Result<Self, crate::domain::errors::UnknownCategoryError> {
        let mut presupuesto_siguiente = BTreeMap::new();
        for (clave, importe) in pares {
            let categoria = ExpenseCategory::parse(clave)?;
            presupuesto_siguiente.insert(categoria, *importe);
        }
        Ok(Self { mes: mes.to_string(), presupuesto_siguiente })
    }
}
