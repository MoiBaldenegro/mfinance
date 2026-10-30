//! Tipos serializables del plan de deuda: deuda ordenada, fila de
//! proyección, proyección completa y plan agregado.

use serde::Serialize;

/// Deuda ordenada para el plan (referencia a la entidad del dominio).
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct DeudaPlan {
    /// Nombre de la deuda.
    pub nombre: String,
    /// Saldo pendiente actual.
    pub saldo_pendiente: f64,
    /// Tasa de interés anual en %.
    pub tasa_interes_anual: f64,
    /// Pago mínimo mensual estimado: el mayor entre el 2 % del saldo, el
    /// interés del mes más un 1 % de capital y 25. Siempre amortiza.
    pub pago_minimo_mensual: f64,
}

impl DeudaPlan {
    pub(crate) fn desde_liability(liability: &crate::domain::liability::Liability) -> Self {
        let saldo = liability.saldo_pendiente();
        let interes_mes = saldo * liability.tasa_interes_anual() / 100.0 / 12.0;
        let pago_minimo = (saldo * 0.02).max(interes_mes + saldo * 0.01).max(25.0);
        Self {
            nombre: liability.nombre().to_string(),
            saldo_pendiente: liability.saldo_pendiente(),
            tasa_interes_anual: liability.tasa_interes_anual(),
            pago_minimo_mensual: pago_minimo,
        }
    }
}

/// Fila de la proyección mes a mes.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct FilaProyeccionDeuda {
    /// Número de mes (1-indexed).
    pub mes: u32,
    /// Saldo total restante de todas las deudas al inicio del mes.
    pub saldo_total_restante: f64,
    /// Pago total realizado en el mes (mínimos + extra).
    pub pago_total_mes: f64,
    /// Intereses pagados en el mes.
    pub intereses_mes: f64,
    /// Principal amortizado en el mes.
    pub principal_mes: f64,
}

/// Proyección completa del plan de deuda.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ProyeccionDeuda {
    /// Filas mes a mes hasta liquidar todas las deudas.
    pub filas: Vec<FilaProyeccionDeuda>,
    /// Meses totales hasta quedar libre de deuda.
    pub meses_hasta_libre: u32,
    /// Intereses totales pagados en el plan.
    pub intereses_totales: f64,
    /// Total pagado (principal + intereses).
    pub total_pagado: f64,
    /// Intereses ahorrados respecto al plan sin pago extra.
    pub intereses_ahorrados: f64,
}

/// Plan de deuda completo: órdenes + proyección + deuda objetivo.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct PlanDeuda {
    /// Deudas ordenadas por avalancha (tasa descendente).
    pub orden_avalancha: Vec<DeudaPlan>,
    /// Deudas ordenadas por bola de nieve (saldo ascendente).
    pub orden_bola_nieve: Vec<DeudaPlan>,
    /// Proyección mes a mes según la estrategia y extra del snapshot.
    pub proyeccion: ProyeccionDeuda,
    /// Deuda a atacar primero según la estrategia elegida (None si no hay deudas).
    pub deuda_objetivo: Option<DeudaPlan>,
}
