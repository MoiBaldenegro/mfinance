//! Patrimonio del seed: activos, pasivos con tasas distintas,
//! inversiones en las tres familias y estados de cuenta conciliados
//! (saldo final = saldo teórico) para indicadores limpios.

use crate::domain::account_statement::{AccountStatement, Movement};
use crate::domain::asset::{Asset, AssetCategory};
use crate::domain::investment::{Investment, InvestmentFamily};
use crate::domain::liability::Liability;

pub fn assets() -> Vec<Asset> {
    vec![
        Asset::new(
            "Cuenta corriente".into(),
            AssetCategory::Liquido,
            4180.50,
        )
        .expect("seed válido"),
        Asset::new(
            "Fondo de emergencia".into(),
            AssetCategory::Liquido,
            6000.00,
        )
        .expect("seed válido"),
        Asset::new("Coche".into(), AssetCategory::Propiedad, 11500.00)
            .expect("seed válido"),
    ]
}

pub fn liabilities() -> Vec<Liability> {
    vec![
        Liability::new("Hipoteca del piso en alquiler".into(), 142000.0, 3.2)
            .expect("seed válido"),
        Liability::new("Préstamo del coche".into(), 8400.0, 6.5)
            .expect("seed válido"),
        Liability::new("Préstamo personal".into(), 2300.0, 9.8)
            .expect("seed válido"),
    ]
}

pub fn investments() -> Vec<Investment> {
    vec![
        Investment::new(InvestmentFamily::RentaFija, 150.0, 7800.0, 3.5)
            .expect("seed válido"),
        Investment::new(InvestmentFamily::RentaVariable, 250.0, 12400.0, 7.0)
            .expect("seed válido"),
        Investment::new(InvestmentFamily::FincaRaiz, 0.0, 118000.0, 4.0)
            .expect("seed válido"),
    ]
}

pub fn account_statements() -> Vec<AccountStatement> {
    let julio = vec![
        movement("2026-07-01", "Salario de julio", 2475.00),
        movement("2026-07-03", "Alquiler recibido", 650.00),
        movement("2026-07-05", "Supermercado", -382.40),
        movement("2026-07-12", "Gasolinera", -57.30),
        movement("2026-07-18", "Cine en familia", -24.50),
        movement("2026-07-25", "Suscripciones", -18.99),
    ];
    let ahorro = vec![
        movement("2026-07-02", "Ahorro automático", 400.00),
        movement("2026-07-20", "Retirada para imprevisto", -350.00),
    ];
    vec![
        AccountStatement::new(
            "Cuenta corriente principal".into(),
            3920.75,
            julio,
            6562.56,
        ),
        AccountStatement::new(
            "Cuenta de ahorro programado".into(),
            5500.00,
            ahorro,
            5550.00,
        ),
    ]
}

fn movement(fecha: &str, concepto: &str, importe: f64) -> Movement {
    Movement { fecha: fecha.into(), concepto: concepto.into(), importe }
}
