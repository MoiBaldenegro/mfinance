//! REQ-03-06/07: el puerto SnapshotRepository declara load save export e
//! import y se ejercita con un doble en memoria; cada operación fallible
//! devuelve su error nombrado.

use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;
use crate::domain::tests::fake_repository::{FailPoint, FakeSnapshotRepository};

fn sample() -> FinanceSnapshot {
    let mut snap = FinanceSnapshot::new();
    snap.strategy.extra_monthly_payment = 75.0;
    snap
}

#[test]
fn load_without_prior_save_yields_named_load_error() {
    let repo = FakeSnapshotRepository::new();
    let err = repo.load().unwrap_err();
    assert_eq!(err.reason, "sin snapshot almacenado");
}

#[test]
fn save_then_load_returns_identical_snapshot() {
    let mut repo = FakeSnapshotRepository::new();
    let original = sample();
    repo.save(&original).expect("save ok");
    let loaded = repo.load().expect("load ok");
    assert_eq!(loaded, original);
}

#[test]
fn export_then_import_roundtrips_the_same_snapshot() {
    let mut repo = FakeSnapshotRepository::new();
    let original = sample();
    repo.export(&original).expect("export ok");
    let imported = repo.import().expect("import ok");
    assert_eq!(imported, original);
}

#[test]
fn import_without_export_yields_named_import_error() {
    let repo = FakeSnapshotRepository::new();
    let err = repo.import().unwrap_err();
    assert_eq!(err.reason, "no hay copia exportada");
}

#[test]
fn each_operation_reports_its_own_named_error_on_failure() {
    let mut repo = FakeSnapshotRepository::new();
    let snap = sample();
    for point in [
        FailPoint::Load,
        FailPoint::Save,
        FailPoint::Export,
        FailPoint::Import,
    ] {
        repo.fail_point = Some(point.clone());
        match point {
            FailPoint::Load => assert!(repo.load().is_err()),
            FailPoint::Save => assert!(repo.save(&snap).is_err()),
            FailPoint::Export => assert!(repo.export(&snap).is_err()),
            FailPoint::Import => assert!(repo.import().is_err()),
        }
    }
}
