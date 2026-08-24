//! REQ-03-05: agregado FinanceSnapshot que agrupa registros mensuales,
//! activos, pasivos, inversiones, estados de cuenta y ajustes de estrategia.

use serde::{Deserialize, Serialize};

use crate::domain::account_statement::AccountStatement;
use crate::domain::asset::Asset;
use crate::domain::currency::Currency;
use crate::domain::investment::Investment;
use crate::domain::liability::Liability;
use crate::domain::monthly_assessment::MonthlyAssessment;
use crate::domain::monthly_record::MonthlyRecord;

/// Estrategia de ataque a la deuda del plan (avalancha o bola de nieve).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DebtStrategy {
    Avalanche,
    Snowball,
}

/// Ajustes de estrategia persistidos junto al resto del agregado.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StrategySettings {
    /// Estrategia elegida para el plan de deuda.
    pub debt_strategy: DebtStrategy,
    /// Pago extra mensual dedicado a la deuda objetivo, en euros.
    pub extra_monthly_payment: f64,
    /// REQ-19-01: moneda de visualización del snapshot; re-etiqueta la
    /// presentación sin convertir importes. REQ-19-02: los archivos
    /// antiguos sin el campo completan a MXN por el default.
    #[serde(default)]
    pub currency: Currency,
}

impl Default for StrategySettings {
    fn default() -> Self {
        Self {
            debt_strategy: DebtStrategy::Avalanche,
            extra_monthly_payment: 0.0,
            currency: Currency::default(),
        }
    }
}

/// Raíz del agregado financiero: todo el estado del usuario.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct FinanceSnapshot {
    /// Histórico de registros mensuales.
    pub monthly_records: Vec<MonthlyRecord>,
    /// Activos patrimoniales.
    pub assets: Vec<Asset>,
    /// Pasivos con saldo y tasa.
    pub liabilities: Vec<Liability>,
    /// Inversiones por familia.
    pub investments: Vec<Investment>,
    /// Estados de cuenta para conciliación.
    pub account_statements: Vec<AccountStatement>,
    /// Ajustes de estrategia del usuario.
    pub strategy: StrategySettings,
    /// Assessments de los meses cerrados (REQ-16-08); un mes con
    /// assessment está cerrado hasta reabrirlo explícitamente.
    #[serde(default)]
    pub assessments: Vec<MonthlyAssessment>,
}

impl FinanceSnapshot {
    /// Snapshot vacío con estrategia neutra.
    pub fn new() -> Self {
        Self::default()
    }

    /// REQ-16-07: ¿el mes (YYYY-MM) está cerrado? Un mes está cerrado
    /// exactamente cuando existe su assessment de cierre.
    pub fn mes_cerrado(&self, mes: &str) -> bool {
        self.assessments.iter().any(|a| a.mes().as_str() == mes)
    }

    /// Assessment persistido de un mes cerrado, si existe.
    pub fn assessment_de(&self, mes: &str) -> Option<&MonthlyAssessment> {
        self.assessments.iter().find(|a| a.mes().as_str() == mes)
    }

    /// REQ-16-08: histórico de cierres tal cual quedó persistido.
    pub fn historico_cierres(&self) -> &[MonthlyAssessment] {
        &self.assessments
    }
}
