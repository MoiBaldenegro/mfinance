//! REQ-12-16/20: heurísticas de líneas del parser — fila nueva con fecha
//! e importe, concepto multilínea sin filas fantasma, blacklist de pies
//! del banco y golden rule informativa (Verificada/Discrepancia/No
//! verificable). Tests escritos ANTES de la implementación.

use crate::application::diagnostico::parser_extracto::parsear_extracto;
use crate::domain::comprobante_pdf::Coherencia;

#[test]
fn lote_correcto_extrae_fecha_comercio_e_importe_espanol() {
    let paginas = vec![vec![
        "BANCO EJEMPLO EXTRACTO MENSUAL",
        "01/06/2026 SUPERMERCADO ACME 45,30-",
        "03/06/2026 NOMINA EMPRESA 2.350,00",
    ]
    .join("\n")];
    let parseo = parsear_extracto(&paginas);
    assert_eq!(parseo.movimientos.len(), 2);
    assert_eq!(parseo.movimientos[0].fecha, "2026-06-01");
    assert_eq!(parseo.movimientos[0].comercio, "SUPERMERCADO ACME");
    assert!((parseo.movimientos[0].importe - -45.30).abs() < 1e-9);
    assert_eq!(parseo.movimientos[1].comercio, "NOMINA EMPRESA");
    assert!((parseo.movimientos[1].importe - 2_350.00).abs() < 1e-9);
}

#[test]
fn linea_sin_fecha_ni_importe_concatena_el_concepto_anterior() {
    let paginas = vec![vec![
        "05/06/2026 GASOLINA REPSOL 23,75-",
        "ESTACION NUMERO 7 CARRETERA N-III",
        "10/06/2026 ALQUILER PISO 800,00-",
    ]
    .join("\n")];
    let parseo = parsear_extracto(&paginas);
    assert_eq!(parseo.movimientos.len(), 2);
    assert_eq!(
        parseo.movimientos[0].comercio,
        "GASOLINA REPSOL ESTACION NUMERO 7 CARRETERA N-III"
    );
    assert_eq!(parseo.movimientos[1].comercio, "ALQUILER PISO");
}

#[test]
fn pies_del_banco_y_totales_no_generan_filas_fantasma() {
    let paginas = vec![vec![
        "BANCO EJEMPLO",
        "Estimado cliente gracias por su confianza",
        "Total movimientos 3",
        "Página 1 de 2",
        "01/07/2026 TRASTES TIENDA 12,00",
    ]
    .join("\n")];
    let parseo = parsear_extracto(&paginas);
    assert_eq!(parseo.movimientos.len(), 1);
    assert_eq!(parseo.movimientos[0].comercio, "TRASTES TIENDA");
}

#[test]
fn golden_rule_cuadra_saldo_inicial_abonos_cargos_y_saldo_final() {
    let paginas = vec![vec![
        "Saldo inicial 1.000,00",
        "01/06/2026 SUPERMERCADO ACME 45,30-",
        "03/06/2026 NOMINA EMPRESA 2.350,00",
        "Saldo final 3.304,70",
    ]
    .join("\n")];
    // 1000,00 + 2350,00 - 45,30 = 3304,70 → Verificada.
    let parseo = parsear_extracto(&paginas);
    assert_eq!(parseo.coherencia, Coherencia::Verificada);
}

#[test]
fn golden_rule_detecta_discrepancia_cuando_no_cuadra() {
    let paginas = vec![vec![
        "Saldo inicial 1.000,00",
        "01/06/2026 SUPERMERCADO ACME 45,30-",
        "Saldo final 999,99",
    ]
    .join("\n")];
    // Teórico 954,70 ≠ 999,99 → Discrepancia.
    let parseo = parsear_extracto(&paginas);
    assert_eq!(parseo.coherencia, Coherencia::Discrepancia);
}

#[test]
fn golden_rule_no_verificable_si_faltan_saldos_impresos() {
    let paginas = vec![
        vec!["01/06/2026 SUPERMERCADO ACME 45,30-"].join("\n"),
        String::new(),
    ];
    let parseo = parsear_extracto(&paginas);
    assert_eq!(parseo.coherencia, Coherencia::NoVerificable);
}
