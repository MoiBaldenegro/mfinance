//! Tests de la entidad MonthlyAssessment (REQ-16-03/08): el assessment
//! persistido del cierre mensual con fecha, indicadores y decisiones.

use std::collections::BTreeMap;

use crate::domain::catalogs::ExpenseCategory;
use crate::domain::month_key::MonthKey;
use crate::domain::monthly_assessment::{IndicadorCerrado, MonthlyAssessment};

fn mes() -> MonthKey {
    MonthKey::parse("2026-07").expect("mes válido")
}

fn indicadores() -> Vec<IndicadorCerrado> {
    vec![
        IndicadorCerrado {
            nombre: "Endeudamiento".into(),
            valor: Some(12.5),
            clasificacion: "verde".into(),
        },
        IndicadorCerrado {
            nombre: "Tasa de ahorro".into(),
            valor: None,
            clasificacion: "sin_datos".into(),
        },
    ]
}

fn presupuesto() -> BTreeMap<ExpenseCategory, f64> {
    let mut mapa = BTreeMap::new();
    mapa.insert(ExpenseCategory::Vivienda, 950.0);
    mapa.insert(ExpenseCategory::Ocio, 120.0);
    mapa
}

#[test]
fn expone_mes_fecha_indicadores_y_presupuesto() {
    let assessment = MonthlyAssessment::nuevo(
        mes(),
        "2026-08-01",
        indicadores(),
        presupuesto(),
    );
    assert_eq!(assessment.mes().as_str(), "2026-07");
    assert_eq!(assessment.fecha_cierre(), "2026-08-01");
    assert_eq!(assessment.indicadores(), &indicadores());
    assert_eq!(assessment.presupuesto_siguiente(), &presupuesto());
}

#[test]
fn permite_cerrar_sin_objetivos_de_gasto() {
    let assessment =
        MonthlyAssessment::nuevo(mes(), "2026-08-01", vec![], BTreeMap::new());
    assert!(assessment.presupuesto_siguiente().is_empty());
    assert_eq!(assessment.fecha_cierre(), "2026-08-01");
}

#[test]
fn round_trip_serde_conserva_el_assessment_persistido() {
    let original =
        MonthlyAssessment::nuevo(mes(), "2026-08-01", indicadores(), presupuesto());
    let json = serde_json::to_string(&original).expect("serializable");
    let recuperado: MonthlyAssessment =
        serde_json::from_str(&json).expect("deserializable");
    assert_eq!(original, recuperado);
}
