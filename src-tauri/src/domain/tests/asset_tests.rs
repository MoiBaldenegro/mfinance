//! REQ-03-02/09: Asset con nombre, categoría y valor actual; valor
//! negativo rechazado con error nombrado.

use crate::domain::asset::{Asset, AssetCategory};
use crate::domain::errors::NegativeValueError;

#[test]
fn builds_asset_with_name_category_and_current_value() {
    let asset = Asset::new(
        "Fondo indexado".to_string(),
        AssetCategory::Inversion,
        12500.0,
    )
    .expect("asset válido");
    assert_eq!(asset.nombre(), "Fondo indexado");
    assert_eq!(asset.categoria(), AssetCategory::Inversion);
    assert!((asset.valor_actual() - 12500.0).abs() < 1e-9);
}

#[test]
fn zero_value_asset_is_valid() {
    assert!(Asset::new("Cuenta nueva".to_string(), AssetCategory::Liquido, 0.0).is_ok());
}

#[test]
fn negative_value_is_rejected_with_named_error() {
    let err = Asset::new(
        "Deuda fantasma".to_string(),
        AssetCategory::Liquido,
        -1.0,
    )
    .unwrap_err();
    assert_eq!(
        err,
        NegativeValueError {
            entidad: "Asset",
            campo: "valor_actual",
            valor: -1.0,
        }
    );
    assert_eq!(
        err.to_string(),
        "valor negativo no permitido: Asset.valor_actual = -1"
    );
}
