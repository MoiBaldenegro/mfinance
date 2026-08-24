//! REQ-27-06: consolidación completa del snapshot al finalizar el
//! onboarding con los cuatro pasos; complementa `..._defectos_tests`.
use crate::application::perfiles_onboarding::{
    actualizar_onboarding, completar_onboarding_con_snapshot,
};
use crate::application::tests::{
    memory_perfil_repository::MemoryPerfilRepository, memory_repository::MemoryRepository,
};
use crate::domain::currency::Currency;
use crate::domain::investment::{Investment, InvestmentFamily};
use crate::domain::onboarding::{
    OnboardingData, OnboardingInversion, OnboardingStatus, Paso1Data,
    Paso2Data, Paso3Data, Paso4Data, SupuestoProyeccion, UmbralesIndicadores,
};
use crate::domain::snapshot::{DebtStrategy, FinanceSnapshot};

fn paso1() -> Paso1Data {
    Paso1Data {
        nombre_completo: "Ana García".into(),
        moneda: Currency::Usd,
        fuentes_ingreso_activas: vec!["salario".into()],
        categorias_gasto_usadas: vec!["vivienda".into(), "ocio".into()],
    }
}

fn paso2() -> Paso2Data {
    let familias = [
        ("renta_fija", 500.0, 5000.0, 7.5),
        ("renta_variable", 200.0, 2000.0, 9.0),
    ];
    let inversiones: Vec<OnboardingInversion> = familias
        .iter()
        .map(|(f, a, v, t)| OnboardingInversion {
            familia: (*f).into(), aporte_mensual: *a, valor_actual: *v,
            tasa_esperada_anual: *t,
        })
        .collect();
    Paso2Data { activos: vec![], pasivos: vec![], inversiones }
}

fn paso3() -> Paso3Data {
    Paso3Data {
        estrategia_deuda: Some("Snowball".into()),
        pago_extra_mensual: Some(500.0),
        supuestos_proyeccion: vec![SupuestoProyeccion { variable: "salario".into(), porcentaje: 3.0 }],
    }
}

fn paso4() -> Paso4Data {
    let umbrales = UmbralesIndicadores {
        endeudamiento_verde: Some(12.0), endeudamiento_rojo: Some(28.0),
        ahorro_verde: Some(20.0), ahorro_rojo: Some(4.0),
        fondo_verde: Some(6.0), fondo_rojo: Some(1.0),
        ingreso_pasivo_verde: Some(120.0), ingreso_pasivo_amarillo: Some(30.0),
    };
    Paso4Data { umbrales }
}

fn snapshot_base() -> FinanceSnapshot {
    let mut snapshot = FinanceSnapshot::new();
    for familia in InvestmentFamily::ALL {
        snapshot.investments.push(Investment::new(familia, 0.0, 0.0, 5.0).unwrap());
    }
    snapshot
}

#[test]
fn finalizar_consolida_snapshot_estrategia_e_inversiones() {
    let mut repo = MemoryPerfilRepository::new();
    let id = repo.crear("Ana").unwrap().id;
    let datos = OnboardingData {
        paso1: Some(paso1()), paso2: Some(paso2()),
        paso3: Some(paso3()), paso4: Some(paso4()),
    };
    actualizar_onboarding(&mut repo, &id, datos).unwrap();
    let mut snapshots = MemoryRepository { stored: Some(snapshot_base()), ..Default::default() };
    let r = completar_onboarding_con_snapshot(&mut repo, &mut snapshots, &id);
    let perfil = r.unwrap();
    // Estado y perfil financiero consolidados (REQ-23-08).
    assert_eq!(perfil.onboarding_status, OnboardingStatus::Completed);
    assert_eq!(perfil.financial_profile.fuentes_ingreso_activas, vec!["salario"]);
    assert_eq!(perfil.financial_profile.pago_extra_mensual, Some(500.0));
    assert_eq!(perfil.financial_profile.estrategia_deuda_preferida, Some("Snowball".into()));
    assert_eq!(perfil.financial_profile.familias_inversion_activas.len(), 2);
    assert_eq!(perfil.financial_profile.umbrales_indicadores, paso4().umbrales);
    // El perfil quedó activo (los commands operan sobre SU snapshot).
    assert_eq!(repo.registro.as_ref().unwrap().activa.as_deref(), Some(id.as_str()));
    // StrategySettings desde paso 1 y paso 3.
    let guardado = snapshots.stored.clone().unwrap();
    assert_eq!(guardado.strategy.currency, Currency::Usd);
    assert_eq!(guardado.strategy.debt_strategy, DebtStrategy::Snowball);
    assert_eq!(guardado.strategy.extra_monthly_payment, 500.0);
    // Investment.tasa_esperada por familia: existentes se actualizan.
    let tasa_de = |f: InvestmentFamily| guardado.investments.iter()
        .find(|i| i.familia() == f).unwrap().tasa_esperada_anual();
    assert_eq!(tasa_de(InvestmentFamily::RentaFija), 7.5);
    assert_eq!(tasa_de(InvestmentFamily::RentaVariable), 9.0);
    // Familias sin dato del wizard conservan su tasa previa.
    assert_eq!(tasa_de(InvestmentFamily::FincaRaiz), 5.0);
}
