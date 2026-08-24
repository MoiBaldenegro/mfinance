//! REQ-13-01..06: motor de conciliación — cálculo mensual y agregado de movimientos.

use crate::application::conciliacion_types::{
    ConciliacionError, ConciliacionMensual, HistoricoConciliacion,
};
use crate::domain::account_statement::{AccountStatement, Movement};
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;

/// Calcula la conciliación mensual para un mes dado (YYYY-MM).
pub fn conciliacion_mensual(
    repo: &dyn SnapshotRepository,
    mes: &str,
) -> Result<ConciliacionMensual, ConciliacionError> {
    let snapshot = repo.load()?;
    let historico = HistoricoConciliacion::from_snapshot(&snapshot);
    Ok(historico.por_mes(mes)
        .cloned()
        .unwrap_or_else(|| ConciliacionMensual {
            mes: mes.to_string(),
            cuentas: vec![],
            todas_conciliadas: true,
        }))
}

/// Agrega un movimiento a una cuenta en un mes y persiste el snapshot actualizado.
/// Devuelve el snapshot actualizado.
pub fn agregar_movimiento(
    repo: &mut dyn SnapshotRepository,
    _mes: &str,
    cuenta_nombre: &str,
    movimiento: Movement,
) -> Result<FinanceSnapshot, ConciliacionError> {
    // Validaciones básicas
    if movimiento.concepto.trim().is_empty() {
        return Err(ConciliacionError::MovimientoInvalido("concepto vacío".into()));
    }
    if !movimiento.importe.is_finite() {
        return Err(ConciliacionError::MovimientoInvalido("importe no numérico".into()));
    }
    
    let mut snapshot = repo.load()?;
    
    // Buscar la cuenta en el mes correspondiente
    let idx = snapshot.account_statements.iter().position(|e| e.cuenta() == cuenta_nombre)
        .ok_or_else(|| ConciliacionError::CuentaNoEncontrada(cuenta_nombre.into()))?;
    
    let estado = snapshot.account_statements[idx].clone();
    let mut movimientos = estado.movimientos().to_vec();
    movimientos.push(movimiento);
    
    // Reconstruir AccountStatement con el nuevo movimiento
    let nuevo_estado = AccountStatement::new(
        estado.cuenta().to_string(),
        estado.saldo_inicial(),
        movimientos,
        estado.saldo_final(),
    );
    
    snapshot.account_statements[idx] = nuevo_estado;
    
    repo.save(&snapshot)?;
    Ok(snapshot)
}