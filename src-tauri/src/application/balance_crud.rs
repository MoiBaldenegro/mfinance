//! REQ-32-01..03: casos de uso CRUD de activos y pasivos sobre el
//! snapshot del perfil activo. Validan con el dominio (NegativeValueError)
//! ANTES de persistir y devuelven el snapshot actualizado; delegan la
//! escritura atómica en save_state.

use crate::application::balance_crud_error::BalanceCrudError;
use crate::application::save_state::save_state;
use crate::domain::asset::{Asset, AssetCategory};
use crate::domain::liability::Liability;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;

/// Traduce la categoría de cable (p. ej. «liquido») al enum de dominio,
/// sin distinguir mayúsculas.
fn categoria_de(valor: &str) -> Result<AssetCategory, BalanceCrudError> {
    match valor.trim().to_ascii_lowercase().as_str() {
        "liquido" => Ok(AssetCategory::Liquido),
        "inversion" => Ok(AssetCategory::Inversion),
        "propiedad" => Ok(AssetCategory::Propiedad),
        otro => Err(BalanceCrudError::CategoriaInvalida { valor: otro.to_string() }),
    }
}

/// Inserta o edita (por nombre) un activo y persiste el snapshot.
pub fn asset_upsert(
    repo: &mut dyn SnapshotRepository,
    nombre: &str,
    categoria: &str,
    valor_actual: f64,
) -> Result<FinanceSnapshot, BalanceCrudError> {
    let categoria = categoria_de(categoria)?;
    let activo = Asset::new(nombre.to_string(), categoria, valor_actual)
        .map_err(BalanceCrudError::ValorNegativo)?;
    let mut snapshot = repo.load().map_err(BalanceCrudError::Carga)?;
    upsert(&mut snapshot.assets, activo, |a| a.nombre());
    guardar(repo, &snapshot)?;
    Ok(snapshot)
}

/// Elimina el activo con ese nombre y persiste el snapshot.
pub fn asset_eliminar(
    repo: &mut dyn SnapshotRepository,
    nombre: &str,
) -> Result<FinanceSnapshot, BalanceCrudError> {
    let mut snapshot = repo.load().map_err(BalanceCrudError::Carga)?;
    snapshot.assets.retain(|a| a.nombre() != nombre);
    guardar(repo, &snapshot)?;
    Ok(snapshot)
}

/// Inserta o edita (por nombre) un pasivo y persiste el snapshot.
pub fn liability_upsert(
    repo: &mut dyn SnapshotRepository,
    nombre: &str,
    saldo_pendiente: f64,
    tasa_interes_anual: f64,
) -> Result<FinanceSnapshot, BalanceCrudError> {
    let pasivo = Liability::new(nombre.to_string(), saldo_pendiente, tasa_interes_anual)
        .map_err(BalanceCrudError::ValorNegativo)?;
    let mut snapshot = repo.load().map_err(BalanceCrudError::Carga)?;
    upsert(&mut snapshot.liabilities, pasivo, |l| l.nombre());
    guardar(repo, &snapshot)?;
    Ok(snapshot)
}

/// Elimina el pasivo con ese nombre y persiste el snapshot.
pub fn liability_eliminar(
    repo: &mut dyn SnapshotRepository,
    nombre: &str,
) -> Result<FinanceSnapshot, BalanceCrudError> {
    let mut snapshot = repo.load().map_err(BalanceCrudError::Carga)?;
    snapshot.liabilities.retain(|l| l.nombre() != nombre);
    guardar(repo, &snapshot)?;
    Ok(snapshot)
}

/// Reemplaza el elemento con ese nombre o lo añade al final.
fn upsert<T>(coleccion: &mut Vec<T>, nuevo: T, nombre_de: fn(&T) -> &str) {
    let nombre = nombre_de(&nuevo).to_string();
    match coleccion.iter_mut().find(|e| nombre_de(e) == nombre) {
        Some(slot) => *slot = nuevo,
        None => coleccion.push(nuevo),
    }
}

fn guardar(
    repo: &mut dyn SnapshotRepository,
    snapshot: &FinanceSnapshot,
) -> Result<(), BalanceCrudError> {
    save_state(repo, snapshot).map_err(BalanceCrudError::Guardado)
}
