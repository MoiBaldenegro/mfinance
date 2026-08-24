//! Dobles y constructores compartidos por los tests de la proyección.

use super::memory_repository::MemoryRepository;
use crate::application::pyg_proyeccion::SupuestosProyeccion;
use crate::domain::asset::AssetCategory;
use crate::domain::asset::Asset;
use crate::domain::liability::Liability;
use crate::domain::monthly_record::MonthlyRecord;
use crate::domain::snapshot::FinanceSnapshot;

/// Registro mensual válido desde claves crudas.
pub fn registro(
    mes: &str,
    ingresos: &[(&str, f64)],
    gastos: &[(&str, f64)],
) -> MonthlyRecord {
    MonthlyRecord::from_raw(mes, ingresos, gastos).expect("registro válido")
}

/// Activo líquido de prueba.
pub fn asset(nombre: &str, valor: f64) -> Asset {
    Asset::new(nombre.to_string(), AssetCategory::Liquido, valor)
        .expect("asset válido")
}

/// Pasivo de prueba con saldo y tasa anual.
pub fn liability(nombre: &str, saldo: f64, tasa: f64) -> Liability {
    Liability::new(nombre.to_string(), saldo, tasa).expect("liability válido")
}

/// Repositorio en memoria que devuelve el snapshot dado.
pub fn repo_con_snapshot(snapshot: FinanceSnapshot) -> MemoryRepository {
    let mut repo = MemoryRepository::default();
    repo.stored = Some(snapshot);
    repo
}

/// Snapshot solo con registros mensuales.
pub fn snapshot_con_registro(registros: Vec<MonthlyRecord>) -> FinanceSnapshot {
    let mut snapshot = FinanceSnapshot::new();
    snapshot.monthly_records = registros;
    snapshot
}

/// Snapshot completo con registros activos y pasivos.
pub fn snapshot_completo(
    registros: Vec<MonthlyRecord>,
    assets: Vec<Asset>,
    liabilities: Vec<Liability>,
) -> FinanceSnapshot {
    let mut snapshot = FinanceSnapshot::new();
    snapshot.monthly_records = registros;
    snapshot.assets = assets;
    snapshot.liabilities = liabilities;
    snapshot
}

/// Supuestos desde pares crudos (clave canónica → variación mensual).
pub fn supuestos_con(
    ingresos: &[(&str, f64)],
    gastos: &[(&str, f64)],
) -> SupuestosProyeccion {
    let mut supuestos = SupuestosProyeccion::default();
    for (clave, variacion) in ingresos {
        supuestos.variacion_ingresos.insert(clave.to_string(), *variacion);
    }
    for (clave, variacion) in gastos {
        supuestos.variacion_gastos.insert(clave.to_string(), *variacion);
    }
    supuestos
}
