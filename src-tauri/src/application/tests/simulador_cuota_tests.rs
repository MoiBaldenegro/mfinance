//! Tests REQ-15-01/06 del simulador: cuota mensual, total de intereses y
//! tabla de amortización contra un caso conocido (10.000 €, 12 meses, 12%).

use crate::application::simulador_creditos::cuota::cuota_mensual;
use crate::application::simulador_creditos::motor::amortizar;

/// Caso conocido: 10.000 € al 12 % anual durante 12 meses → cuota 888,49 €
/// e intereses totales 661,85 € (sistema francés, tipo mensual 1 %).
#[test]
fn cuota_mensual_contra_caso_conocido() {
    let cuota = cuota_mensual(10_000.0, 12, 12.0);
    assert!(
        (cuota - 888.488).abs() <= 0.01,
        "cuota inesperada: {}",
        cuota
    );
}

#[test]
fn amortizacion_base_devuelve_intereses_y_total_contra_caso_conocido() {
    let resultado = amortizar(10_000.0, 12, 12.0).expect("amortización válida");
    assert_eq!(resultado.meses, 12);
    assert!((resultado.cuota_mensual - 888.488).abs() <= 0.01);
    assert!(
        (resultado.intereses_totales - 661.85).abs() <= 0.10,
        "intereses inesperados: {}",
        resultado.intereses_totales
    );
    assert!(
        (resultado.total_pagado - 10_661.85).abs() <= 0.10,
        "total pagado inesperado: {}",
        resultado.total_pagado
    );
}

#[test]
fn tabla_de_amortizacion_mes_a_mes_con_capital_interes_saldo_acumulado() {
    let resultado = amortizar(10_000.0, 12, 12.0).expect("amortización válida");
    assert_eq!(resultado.tabla.len(), 12);

    // Mes 1: interés 1 % de 10.000 € = 100 €; capital = cuota − interés;
    // saldo restante 9.211,51 €; acumulado igual a la cuota.
    let primera = &resultado.tabla[0];
    assert_eq!(primera.mes, 1);
    assert!((primera.interes - 100.0).abs() <= 0.01);
    assert!((primera.capital - 788.49).abs() <= 0.02);
    assert!((primera.saldo_restante - 9_211.51).abs() <= 0.02);
    assert!((primera.total_acumulado - primera.cuota).abs() <= 0.005);

    // Última fila: saldo liquidado y acumulado igual al total pagado.
    let ultima = resultado.tabla.last().expect("tabla con filas");
    assert_eq!(ultima.mes, 12);
    assert!(ultima.saldo_restante.abs() < 0.01);
    assert!((ultima.total_acumulado - resultado.total_pagado).abs() <= 0.01);

    // La suma del capital amortiza exactamente el importe prestado.
    let suma_capital: f64 = resultado.tabla.iter().map(|f| f.capital).sum();
    assert!((suma_capital - 10_000.0).abs() <= 0.01);

    // Cada fila acumula la cuota del mes anterior.
    for par in resultado.tabla.windows(2) {
        let esperado = par[0].total_acumulado + par[1].cuota;
        assert!((par[1].total_acumulado - esperado).abs() <= 0.005);
    }
}
