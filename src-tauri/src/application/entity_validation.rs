//! Revalidación del patrimonio importado: activos, pasivos e inversiones
//! se reconstruyen vía sus constructores, que exigen valores no negativos
//! (REQ-03-09); un JSON que los viole se rechaza con error nombrado.

use crate::application::import_validation::rejected;
use crate::domain::asset::Asset;
use crate::domain::investment::Investment;
use crate::domain::liability::Liability;
use crate::domain::repository_errors::SnapshotImportError;
use crate::domain::snapshot::FinanceSnapshot;

/// Reconstruye los activos exigiendo valor actual no negativo.
/// La categoría se usa directamente (los snapshots nuevos la tienen).
pub fn assets(raw: &FinanceSnapshot) -> Result<Vec<Asset>, SnapshotImportError> {
    raw.assets
        .iter()
        .map(|asset| {
            let categoria = asset.categoria();
            Asset::new(asset.nombre().to_string(), categoria, asset.valor_actual())
                .map_err(|error| rejected("activo", error))
        })
        .collect()
}

/// Reconstruye los pasivos exigiendo saldo y tasa no negativos.
pub fn liabilities(
    raw: &FinanceSnapshot,
) -> Result<Vec<Liability>, SnapshotImportError> {
    raw.liabilities
        .iter()
        .map(|liability| {
            Liability::new(
                liability.nombre().to_string(),
                liability.saldo_pendiente(),
                liability.tasa_interes_anual(),
            )
            .map_err(|error| rejected("pasivo", error))
        })
        .collect()
}

/// Reconstruye las inversiones exigiendo aporte, valor y tasa válidos.
pub fn investments(
    raw: &FinanceSnapshot,
) -> Result<Vec<crate::domain::investment::Investment>, SnapshotImportError> {
    raw.investments
        .iter()
        .map(|investment| {
            Investment::new(
                investment.familia(),
                investment.aporte_mensual(),
                investment.valor_actual(),
                investment.tasa_esperada_anual(),
            )
            .map_err(|error| rejected("inversión", error))
        })
        .collect()
}
