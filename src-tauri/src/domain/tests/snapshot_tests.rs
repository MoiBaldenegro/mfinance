//! REQ-03-05: agregado FinanceSnapshot con registros mensuales, activos,
//! pasivos, inversiones, estados de cuenta y ajustes de estrategia.

use crate::domain::asset::{Asset, AssetCategory};
use crate::domain::currency::Currency;
use crate::domain::investment::{Investment, InvestmentFamily};
use crate::domain::liability::Liability;
use crate::domain::month_key::MonthKey;
use crate::domain::monthly_record::MonthlyRecord;
use crate::domain::snapshot::{DebtStrategy, FinanceSnapshot, StrategySettings};

fn complete_snapshot() -> FinanceSnapshot {
    let mut snap = FinanceSnapshot::new();
    snap.monthly_records.push(
        MonthlyRecord::from_raw(
            "2026-01",
            &[("salario", 2100.0)],
            &[("vivienda", 750.0)],
        )
        .expect("registro válido"),
    );
    snap.assets
        .push(Asset::new("Ahorro".to_string(), AssetCategory::Liquido, 3000.0).unwrap());
    snap.liabilities.push(
        Liability::new("Coche".to_string(), 4000.0, 5.9).unwrap(),
    );
    snap.investments.push(
        Investment::new(InvestmentFamily::RentaFija, 100.0, 1200.0, 3.5)
            .unwrap(),
    );
    snap.strategy = StrategySettings {
        debt_strategy: DebtStrategy::Snowball,
        extra_monthly_payment: 150.0,
        currency: Currency::Mxn,
    };
    snap
}

#[test]
fn aggregate_groups_every_domain_collection() {
    let snap = complete_snapshot();
    assert_eq!(snap.monthly_records.len(), 1);
    assert_eq!(snap.monthly_records[0].mes(), &MonthKey::parse("2026-01").unwrap());
    assert_eq!(snap.assets.len(), 1);
    assert_eq!(snap.liabilities.len(), 1);
    assert_eq!(snap.investments.len(), 1);
    assert_eq!(snap.account_statements.len(), 0);
}

#[test]
fn strategy_settings_are_part_of_the_aggregate() {
    let snap = complete_snapshot();
    assert_eq!(snap.strategy.debt_strategy, DebtStrategy::Snowball);
    assert!((snap.strategy.extra_monthly_payment - 150.0).abs() < 1e-9);
}

#[test]
fn default_snapshot_is_empty_with_neutral_strategy() {
    let snap = FinanceSnapshot::default();
    assert!(snap.monthly_records.is_empty());
    assert_eq!(snap.strategy.debt_strategy, DebtStrategy::Avalanche);
    assert!((snap.strategy.extra_monthly_payment).abs() < 1e-9);
}
