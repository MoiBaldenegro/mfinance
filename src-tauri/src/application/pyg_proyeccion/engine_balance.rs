//! REQ-14-02: motor puro del balance futuro a 12 meses: patrimonio mes
//! a mes con la utilidad proyectada y amortización de pasivos según los
//! pagos actuales (cuotas_deuda del último registro mensual).

use std::collections::BTreeMap;

use super::engine_pyg::calcular_proyeccion_pyg;
use super::types::{BalanceFuturo, FilaBalanceFuturo, SupuestosProyeccion};
use crate::domain::catalogs::ExpenseCategory;
use crate::domain::snapshot::FinanceSnapshot;

/// Pago mensual real a deudas: cuotas_deuda del último registro registrado.
/// Sin registros o sin categoría → 0.0 (no se inventa amortización).
fn pago_mensual_actual(snapshot: &FinanceSnapshot) -> f64 {
    snapshot
        .monthly_records
        .iter()
        .max_by(|a, b| a.mes().cmp(b.mes()))
        .and_then(|r| r.gasto(ExpenseCategory::CuotasDeuda).copied())
        .unwrap_or(0.0)
}

/// Amortiza un paso mensual: la cuota total se reparte entre pasivos
/// proporcionalmente al saldo; en cada pasivo se cubre primero el interés
/// y solo el resto reduce principal (nunca por debajo de cero).
fn amortizar(
    saldos: &mut BTreeMap<String, f64>,
    tasas: &BTreeMap<String, f64>,
    cuota_total: f64,
) {
    let saldo_total: f64 = saldos.values().sum();
    if saldo_total <= 0.0 || cuota_total <= 0.0 {
        return;
    }
    for (nombre, saldo) in saldos.iter_mut() {
        let tasa_anual = tasas.get(nombre).copied().unwrap_or(0.0);
        let interes = *saldo * (tasa_anual / 100.0 / 12.0);
        let asignado = cuota_total * (*saldo / saldo_total);
        let amortizacion = (asignado - interes).max(0.0).min(*saldo);
        *saldo -= amortizacion;
    }
}

/// Motor puro: balance futuro de 12 meses sobre un snapshot cualquiera.
pub fn calcular_balance_futuro(
    snapshot: &FinanceSnapshot,
    supuestos: &SupuestosProyeccion,
) -> BalanceFuturo {
    let activos_actuales: f64 = snapshot.assets.iter().map(|a| a.valor_actual()).sum();
    let pasivos_actuales: f64 =
        snapshot.liabilities.iter().map(|l| l.saldo_pendiente()).sum();

    // Histórico: una fila con los totales vigentes, si hay algo que mostrar.
    let filas_historicas = if snapshot.assets.is_empty() && snapshot.liabilities.is_empty()
    {
        Vec::new()
    } else {
        vec![FilaBalanceFuturo {
            mes: "actual".to_string(),
            activos: activos_actuales,
            pasivos: pasivos_actuales,
            patrimonio: activos_actuales - pasivos_actuales,
        }]
    };

    let mut saldos: BTreeMap<String, f64> = snapshot
        .liabilities
        .iter()
        .map(|l| (l.nombre().to_string(), l.saldo_pendiente()))
        .collect();
    let tasas: BTreeMap<String, f64> = snapshot
        .liabilities
        .iter()
        .map(|l| (l.nombre().to_string(), l.tasa_interes_anual()))
        .collect();

    let cuota_mensual = pago_mensual_actual(snapshot);
    let proyeccion = calcular_proyeccion_pyg(snapshot, supuestos);

    // El ahorro del PyG engorda activos; las cuotas ya están descontadas
    // dentro de los gastos, así que reducir pasivos es el efecto neto.
    let mut activos = activos_actuales;
    let mut filas_proyectadas = Vec::with_capacity(proyeccion.filas_proyectadas.len());
    for fila in &proyeccion.filas_proyectadas {
        activos += fila.utilidad;
        amortizar(&mut saldos, &tasas, cuota_mensual);
        let pasivos: f64 = saldos.values().sum();
        filas_proyectadas.push(FilaBalanceFuturo {
            mes: fila.mes.clone(),
            activos,
            pasivos,
            patrimonio: activos - pasivos,
        });
    }

    BalanceFuturo { filas_historicas, filas_proyectadas }
}
