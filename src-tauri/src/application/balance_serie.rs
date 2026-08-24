//! REQ-08-03/05: caso de uso que calcula el balance patrimonial
//! (totales de activos, pasivos y patrimonio) y la serie mensual de
//! evolución del patrimonio a partir del histórico de snapshots.
//! Puro: sin fs ni framework de escritorio; el command fino lo expone por IPC.

use serde::Serialize;

use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotLoadError;
use crate::domain::snapshot::FinanceSnapshot;

/// Totales del balance: suma de activos, suma de pasivos y patrimonio.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct TotalesBalance {
    /// Suma de valores actuales de todos los activos.
    pub activos: f64,
    /// Suma de saldos pendientes de todos los pasivos.
    pub pasivos: f64,
    /// Patrimonio = activos - pasivos.
    pub patrimonio: f64,
}

/// Fila de la serie mensual de balance: mes y totales de ese mes.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct FilaBalance {
    /// Mes de la fila (YYYY-MM).
    pub mes: String,
    /// Total activos del mes.
    pub activos: f64,
    /// Total pasivos del mes.
    pub pasivos: f64,
    /// Patrimonio del mes (activos - pasivos).
    pub patrimonio: f64,
}

/// Serie mensual completa de evolución del balance ordenada por mes ascendente.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct SerieBalance {
    /// Filas ordenadas; vacía si no hay ningún snapshot histórico.
    pub filas: Vec<FilaBalance>,
}

/// Balance completo: totales actuales + serie mensual histórica.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct BalanceCompleto {
    /// Totales calculados sobre el snapshot vigente.
    pub totales: TotalesBalance,
    /// Serie mensual de evolución patrimonial.
    pub serie: SerieBalance,
}

fn totales_de(snapshot: &FinanceSnapshot) -> TotalesBalance {
    let activos: f64 = snapshot.assets.iter().map(|a| a.valor_actual()).sum();
    let pasivos: f64 = snapshot.liabilities.iter().map(|l| l.saldo_pendiente()).sum();
    TotalesBalance {
        activos,
        pasivos,
        patrimonio: activos - pasivos,
    }
}

/// Motor puro del balance: calcula totales y serie sobre un snapshot cualquiera.
/// Reutilizable por proyecciones futuras.
pub fn calcular_serie_balance(snapshot: &FinanceSnapshot) -> SerieBalance {
    let totales = totales_de(snapshot);
    // Si no hay activos ni pasivos, la serie está vacía.
    if snapshot.assets.is_empty() && snapshot.liabilities.is_empty() {
        return SerieBalance { filas: vec![] };
    }
    // Por ahora, con un solo snapshot vigente, la serie tiene una sola fila.
    // En el futuro, el histórico de snapshots permitirá múltiples filas.
    SerieBalance {
        filas: vec![FilaBalance {
            mes: "actual".to_string(), // placeholder; el histórico real vendrá después
            activos: totales.activos,
            pasivos: totales.pasivos,
            patrimonio: totales.patrimonio,
        }],
    }
}

/// Calcula el balance completo del estado vigente delegando la carga en el puerto.
pub fn balance_serie(
    repository: &dyn SnapshotRepository,
) -> Result<BalanceCompleto, SnapshotLoadError> {
    let snapshot = repository.load()?;
    let totales = totales_de(&snapshot);
    let serie = calcular_serie_balance(&snapshot);
    Ok(BalanceCompleto { totales, serie })
}