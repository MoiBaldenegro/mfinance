//! Tests REQ-11-02/05: caso de uso inversiones_proyeccion — valor futuro
//! compuesto a 5/10/20 años sobre valor actual + aportes mensuales
//! capitalizados a tasa esperada (capitalización mensual); validación tasa
//! negativa o >30% → error nombrado.

use super::memory_repository::MemoryRepository;
use crate::application::inversiones_proyeccion::{
    inversiones_proyeccion, ProyeccionError,
};
use crate::domain::investment::{Investment, InvestmentFamily};
use crate::domain::snapshot::FinanceSnapshot;
use crate::domain::errors::TasaFueraDeRangoError;

fn repo_con(inversiones: Vec<Investment>) -> MemoryRepository {
    let mut repo = MemoryRepository::default();
    let mut snapshot = FinanceSnapshot::new();
    snapshot.investments = inversiones;
    repo.stored = Some(snapshot);
    repo
}

fn inv(familia: InvestmentFamily, aporte: f64, valor: f64, tasa: f64) -> Investment {
    Investment::new(familia, aporte, valor, tasa).expect("inversión válida")
}

#[test]
fn sin_inversiones_devuelve_vacio() {
    let proyeccion = inversiones_proyeccion(&repo_con(vec![])).expect("proyección vacía");
    assert!(proyeccion.familias.is_empty());
    assert_eq!(proyeccion.total_aportes_mensuales, 0.0);
}

#[test]
fn proyeccion_renta_fija_5_10_20_anos_contra_caso_conocido() {
    // valor_actual=10000, aporte_mensual=100, tasa=6% (anual)
    // Capitalización mensual: r_m = 0.06/12 = 0.005
    // 5 años: 60 meses → VF = 10000*(1.005)^60 + 100*((1.005)^60-1)/0.005
    //         = 10000*1.34885015 + 100*(0.34885015)/0.005
    //         = 13488.50 + 6977.00 = 20465.50
    // 10 años: 120 meses → VF = 10000*(1.005)^120 + 100*((1.005)^120-1)/0.005
    //          = 10000*1.81939673 + 100*(0.81939673)/0.005
    //          = 18193.97 + 16387.93 = 34581.90
    // 20 años: 240 meses → VF = 10000*(1.005)^240 + 100*((1.005)^240-1)/0.005
    //          = 10000*3.31020448 + 100*(2.31020448)/0.005
    //          = 33102.04 + 46204.09 = 79306.13
    let repo = repo_con(vec![inv(InvestmentFamily::RentaFija, 100.0, 10000.0, 6.0)]);
    let proyeccion = inversiones_proyeccion(&repo).expect("proyección renta fija");

    assert_eq!(proyeccion.familias.len(), 1);
    let fam = &proyeccion.familias[0];
    assert_eq!(fam.familia, "renta_fija");
    assert!((fam.valor_futuro_5 - 20465.50).abs() < 0.01, "5 años: {}", fam.valor_futuro_5);
    assert!((fam.valor_futuro_10 - 34581.90).abs() < 0.01, "10 años: {}", fam.valor_futuro_10);
    assert!((fam.valor_futuro_20 - 79306.13).abs() < 0.01, "20 años: {}", fam.valor_futuro_20);
    assert_eq!(proyeccion.total_aportes_mensuales, 100.0);
}

#[test]
fn proyeccion_tres_familias_suma_aportes() {
    // renta_fija: 150/mes, 7800 valor, 3.5%
    // renta_variable: 250/mes, 12400 valor, 7%
    // finca_raiz: 300/mes, 50000 valor, 4%
    let repo = repo_con(vec![
        inv(InvestmentFamily::RentaFija, 150.0, 7800.0, 3.5),
        inv(InvestmentFamily::RentaVariable, 250.0, 12400.0, 7.0),
        inv(InvestmentFamily::FincaRaiz, 300.0, 50000.0, 4.0),
    ]);
    let proyeccion = inversiones_proyeccion(&repo).expect("proyección 3 familias");

    assert_eq!(proyeccion.familias.len(), 3);
    assert_eq!(proyeccion.total_aportes_mensuales, 700.0); // 150+250+300
}

#[test]
fn tasa_cero_no_divide_por_cero() {
    // tasa = 0% → VF = valor_actual + aporte_mensual * 12 * años
    let repo = repo_con(vec![inv(InvestmentFamily::RentaFija, 100.0, 10000.0, 0.0)]);
    let proyeccion = inversiones_proyeccion(&repo).expect("proyección tasa cero");

    let fam = &proyeccion.familias[0];
    // 5 años: 10000 + 100*60 = 16000
    assert!((fam.valor_futuro_5 - 16000.0).abs() < 0.01);
    // 10 años: 10000 + 100*120 = 22000
    assert!((fam.valor_futuro_10 - 22000.0).abs() < 0.01);
    // 20 años: 10000 + 100*240 = 34000
    assert!((fam.valor_futuro_20 - 34000.0).abs() < 0.01);
}

#[test]
fn tasa_negativa_rechazada_en_dominio() {
    // El dominio ya rechaza tasa negativa en Investment::new
    let err = Investment::new(
        InvestmentFamily::RentaFija,
        100.0,
        10000.0,
        -1.0,
    ).unwrap_err();
    assert_eq!(err.campo, "tasa_esperada_anual");
}

#[test]
fn tasa_superior_30_rechazada_con_error_nombrado() {
    let repo = repo_con(vec![inv(InvestmentFamily::RentaVariable, 100.0, 10000.0, 35.0)]);
    let err = inversiones_proyeccion(&repo).unwrap_err();
    match err {
        ProyeccionError::Tasa(e) => {
            assert_eq!(
                e,
                TasaFueraDeRangoError {
                    familia: "renta_variable".to_string(),
                    tasa: 35.0,
                }
            );
        }
        _ => panic!("se esperaba ProyeccionError::Tasa, got {:?}", err),
    }
}

#[test]
fn tasa_exactamente_30_es_valida() {
    let repo = repo_con(vec![inv(InvestmentFamily::FincaRaiz, 100.0, 10000.0, 30.0)]);
    let proyeccion = inversiones_proyeccion(&repo).expect("tasa 30% válida");
    assert_eq!(proyeccion.familias.len(), 1);
}