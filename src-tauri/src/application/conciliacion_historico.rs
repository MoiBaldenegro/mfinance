//! REQ-13-07: histórico de conciliación por mes.

use crate::application::conciliacion_types::{ConciliacionMensual, HistoricoConciliacion};
use crate::domain::account_statement::AccountStatement;
use crate::domain::snapshot::FinanceSnapshot;
use std::collections::{HashMap, HashSet};

impl HistoricoConciliacion {
    /// Construye el histórico a partir del snapshot completo.
    pub fn from_snapshot(snapshot: &FinanceSnapshot) -> Self {
        let mut por_mes_data = HashMap::new();
        let mut meses_set = HashSet::new();

        let mut estados_por_mes: HashMap<String, Vec<AccountStatement>> = HashMap::new();
        
        for estado in &snapshot.account_statements {
            let mes = estado.movimientos().first()
                .map(|m| m.fecha[..7].to_string()) // YYYY-MM
                .unwrap_or_else(|| "sin-mes".to_string());
            estados_por_mes.entry(mes).or_default().push(estado.clone());
        }
        
        for (mes, estados) in estados_por_mes {
            meses_set.insert(mes.clone());
            let cuentas: Vec<_> = estados.into_iter().map(|e| {
                crate::application::conciliacion_types::CuentaConciliada {
                    cuenta: e.cuenta().to_string(),
                    saldo_inicial: e.saldo_inicial(),
                    movimientos: e.movimientos().to_vec(),
                    saldo_final: e.saldo_final(),
                    saldo_teorico: e.theoretical_balance(),
                    diferencia: e.difference(),
                    conciliada: e.is_reconciled(),
                }
            }).collect();
            let todas_conciliadas = cuentas.iter().all(|c| c.conciliada);
            por_mes_data.insert(mes.clone(), ConciliacionMensual { mes: mes.clone(), cuentas, todas_conciliadas });
        }
        
        let mut meses: Vec<String> = meses_set.into_iter().collect();
        meses.sort();
        
        Self { meses, por_mes_data }
    }
    
    /// Obtiene la conciliación de un mes específico.
    pub fn por_mes(&self, mes: &str) -> Option<&ConciliacionMensual> {
        self.por_mes_data.get(mes)
    }
}