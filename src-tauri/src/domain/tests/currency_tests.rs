//! REQ-19-01/02/03: la moneda vive en StrategySettings con MXN por
//! defecto, los snapshots antiguos sin el campo completan a MXN y el
//! round-trip serde conserva MXN/USD/EUR sobre FinanceSnapshot.

use crate::domain::currency::Currency;
use crate::domain::snapshot::{DebtStrategy, FinanceSnapshot, StrategySettings};

#[test]
fn default_settings_carry_mxn_currency() {
    let ajustes = StrategySettings::default();
    assert_eq!(ajustes.currency, Currency::Mxn);
    assert_eq!(Currency::default(), Currency::Mxn);
}

#[test]
fn legacy_snapshot_without_currency_completes_to_mxn() {
    // JSON legado sin campo currency en strategy (REQ-19-02).
    let json = r#"{
        "monthly_records": [],
        "assets": [],
        "liabilities": [],
        "investments": [],
        "account_statements": [],
        "strategy": { "debt_strategy": "Snowball", "extra_monthly_payment": 150.0 },
        "assessments": []
    }"#;
    let snap: FinanceSnapshot = serde_json::from_str(json).expect("legado deserializa");
    assert_eq!(snap.strategy.currency, Currency::Mxn);
    // El resto del snapshot llega intacto.
    assert_eq!(snap.strategy.debt_strategy, DebtStrategy::Snowball);
    assert!((snap.strategy.extra_monthly_payment - 150.0).abs() < 1e-9);
}

#[test]
fn currency_round_trips_through_serde() {
    for esperada in [Currency::Mxn, Currency::Usd, Currency::Eur] {
        let mut snap = FinanceSnapshot::new();
        snap.strategy.currency = esperada;
        let json = serde_json::to_string(&snap).expect("serializa");
        let vuelta: FinanceSnapshot = serde_json::from_str(&json).expect("deserializa");
        assert_eq!(vuelta.strategy.currency, esperada);
    }
}

#[test]
fn currency_serializes_with_catalog_code_on_the_wire() {
    // El cable usa los códigos del catálogo que espeja la entidad TS.
    for (valor, codigo) in
        [(Currency::Mxn, "\"MXN\""), (Currency::Usd, "\"USD\""), (Currency::Eur, "\"EUR\"")]
    {
        let ajustes =
            StrategySettings { currency: valor, ..StrategySettings::default() };
        let json = serde_json::to_string(&ajustes).expect("serializa");
        assert!(
            json.contains(&format!("\"currency\":{}", codigo)),
            "cable esperado {} en {}",
            codigo,
            json
        );
    }
}
