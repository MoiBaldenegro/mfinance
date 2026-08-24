//! Tests del seed REQ-04-02 (parte patrimonial): arriendos ligados al
//! piso, catálogos cubiertos, tasas distintas y estados conciliados.

use crate::domain::catalogs::IncomeSource;
use crate::domain::investment::InvestmentFamily;
use crate::seed;

#[test]
fn rent_income_matches_the_rental_property() {
    let snapshot = seed::example_snapshot();
    let finca = snapshot
        .investments
        .iter()
        .find(|inv| inv.familia() == InvestmentFamily::FincaRaiz)
        .expect("el seed incluye finca raíz");
    assert!(finca.valor_actual() > 0.0);
    for record in &snapshot.monthly_records {
        assert_eq!(
            record.ingreso(IncomeSource::Arriendos),
            Some(&650.0),
            "los arriendos salen del piso en alquiler"
        );
    }
}

#[test]
fn patrimony_covers_catalogs_and_distinct_rates() {
    let snapshot = seed::example_snapshot();
    assert!(
        (2..=3).contains(&snapshot.assets.len()),
        "2-3 activos realistas"
    );
    assert!(
        (2..=3).contains(&snapshot.liabilities.len()),
        "2-3 pasivos realistas"
    );
    let tasas: Vec<u32> = snapshot
        .liabilities
        .iter()
        .map(|l| (l.tasa_interes_anual() * 10.0) as u32)
        .collect();
    let mut unicas = tasas.clone();
    unicas.sort_unstable();
    unicas.dedup();
    assert_eq!(unicas.len(), tasas.len(), "tasas de interés distintas");

    for familia in InvestmentFamily::ALL {
        assert!(
            snapshot.investments.iter().any(|inv| inv.familia() == familia),
            "falta la familia {familia:?}"
        );
    }
}

#[test]
fn statements_are_reconciled_for_clean_indicators() {
    let snapshot = seed::example_snapshot();
    assert!(
        (1..=2).contains(&snapshot.account_statements.len()),
        "1-2 estados de cuenta"
    );
    for statement in &snapshot.account_statements {
        assert!(
            statement.is_reconciled(),
            "{} debe estar conciliado",
            statement.cuenta()
        );
    }
}

#[test]
fn strategy_is_present_and_extra_payment_is_positive() {
    let snapshot = seed::example_snapshot();
    assert!(snapshot.strategy.extra_monthly_payment > 0.0);
}
