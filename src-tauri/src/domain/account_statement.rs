//! REQ-03-04: AccountStatement con saldo inicial, movimientos y saldo
//! final para conciliación (saldo teórico = inicial + suma algebraica).

use serde::{Deserialize, Serialize};

/// Movimiento bancario con importe algebraico (negativo = cargo).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Movement {
    /// Fecha del movimiento en formato YYYY-MM-DD.
    pub fecha: String,
    /// Concepto legible del movimiento.
    pub concepto: String,
    /// Importe en euros: positivo abona, negativo carga.
    pub importe: f64,
}

/// Estado de cuenta de una titular para conciliar hasta cuadrar.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AccountStatement {
    cuenta: String,
    saldo_inicial: f64,
    movimientos: Vec<Movement>,
    saldo_final: f64,
}

impl AccountStatement {
    /// Construye el estado de cuenta con sus datos tal cual.
    pub fn new(
        cuenta: String,
        saldo_inicial: f64,
        movimientos: Vec<Movement>,
        saldo_final: f64,
    ) -> Self {
        Self { cuenta, saldo_inicial, movimientos, saldo_final }
    }

    /// Nombre de la cuenta.
    pub fn cuenta(&self) -> &str {
        &self.cuenta
    }

    /// Saldo al inicio del periodo.
    pub fn saldo_inicial(&self) -> f64 {
        self.saldo_inicial
    }

    /// Movimientos del periodo en orden de registro.
    pub fn movimientos(&self) -> &[Movement] {
        &self.movimientos
    }

    /// Saldo real cerrado según el banco.
    pub fn saldo_final(&self) -> f64 {
        self.saldo_final
    }

    /// Saldo teórico: inicial más suma algebraica de movimientos.
    pub fn theoretical_balance(&self) -> f64 {
        self.movimientos.iter().map(|movement| movement.importe).sum::<f64>()
            + self.saldo_inicial
    }

    /// Diferencia exacta entre el saldo real y el teórico.
    pub fn difference(&self) -> f64 {
        self.saldo_final - self.theoretical_balance()
    }

    /// Conciliada cuando real y teórico coinciden (tolerancia medio céntimo).
    pub fn is_reconciled(&self) -> bool {
        self.difference().abs() < 0.005
    }
}
