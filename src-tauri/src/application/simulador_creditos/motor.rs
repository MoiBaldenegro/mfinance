//! Amortización mes a mes del crédito simulado (REQ-15-01/02): interés
//! sobre saldo, cuota francesa más extras y última cuota ajustada al
//! saldo pendiente.

use crate::application::simulador_creditos::cuota::cuota_mensual;
use crate::application::simulador_creditos::errores::ErrorSimulacion;
use crate::application::simulador_creditos::resultado::ResultadoCredito;
use crate::application::simulador_creditos::types::{
    CreditoSimulado, ExtraordinarioPuntual, ExtrasOptimizacion, FilaAmortizacion,
};
use crate::application::simulador_creditos::validacion::validar_credito;

/// Umbral bajo el cual el saldo restante se considera liquidado.
const UMBRAL_SALDO: f64 = 0.005;

fn extraordinarios_del_mes(extraordinarios: &[ExtraordinarioPuntual], mes: u32) -> f64 {
    extraordinarios
        .iter()
        .filter(|p| p.mes == mes)
        .map(|p| p.importe)
        .sum()
}

/// Amortiza el crédito mes a mes con la cuota dada más los extras.
fn amortizar_core(
    importe: f64,
    plazo_meses: u32,
    tasa_interes_anual: f64,
    cuota: f64,
    extra_mensual: f64,
    extraordinarios: &[ExtraordinarioPuntual],
) -> ResultadoCredito {
    let i = tasa_interes_anual / 100.0 / 12.0;
    let mut saldo = importe;
    let mut filas = Vec::new();
    let mut total_pagado = 0.0;
    let mut intereses_totales = 0.0;
    let mut mes = 0u32;

    while mes < plazo_meses && saldo >= UMBRAL_SALDO {
        mes += 1;
        let interes = saldo * i;
        saldo += interes;
        intereses_totales += interes;
        let disponible =
            cuota + extra_mensual.max(0.0) + extraordinarios_del_mes(extraordinarios, mes);
        let pago = disponible.min(saldo);
        saldo -= pago;
        total_pagado += pago;
        filas.push(FilaAmortizacion {
            mes,
            cuota: pago,
            interes,
            capital: pago - interes,
            saldo_restante: if saldo < UMBRAL_SALDO { 0.0 } else { saldo },
            total_acumulado: total_pagado,
        });
    }

    ResultadoCredito {
        cuota_mensual: cuota,
        meses: mes,
        intereses_totales,
        total_pagado,
        tabla: filas,
    }
}

/// Escenario base de un crédito: solo la cuota, sin extras (REQ-15-01).
pub fn amortizar(
    importe: f64,
    plazo_meses: u32,
    tasa_interes_anual: f64,
) -> Result<ResultadoCredito, ErrorSimulacion> {
    validar_credito(&CreditoSimulado {
        nombre: "credito".to_string(),
        importe,
        plazo_meses,
        tasa_interes_anual,
    })?;
    let cuota = cuota_mensual(importe, plazo_meses, tasa_interes_anual);
    Ok(amortizar_core(importe, plazo_meses, tasa_interes_anual, cuota, 0.0, &[]))
}

/// Escenario con extras para el comparador (primitiva interna compartida).
pub(crate) fn amortizar_con_extras(
    credito: &CreditoSimulado,
    extras: &ExtrasOptimizacion,
) -> ResultadoCredito {
    let cuota = cuota_mensual(credito.importe, credito.plazo_meses, credito.tasa_interes_anual);
    amortizar_core(
        credito.importe,
        credito.plazo_meses,
        credito.tasa_interes_anual,
        cuota,
        extras.extra_mensual,
        &extras.extraordinarios,
    )
}
