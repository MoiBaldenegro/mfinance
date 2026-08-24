//! REQ-12-11/12: confirmar_movimientos ACUMULANDO sobre gastos ya
//! existentes del mes y errores nombrados de persistencia inyectados.
//! La creación del registro desde cero vive en
//! diagnostico_confirmar_tests.rs.

use super::diagnostico_fixtures::{aceptado, registro_de};
use super::memory_repository::MemoryRepository;
use crate::application::diagnostico::confirmar_movimientos;
use crate::domain::catalogs::ExpenseCategory;

#[test]
fn confirmar_acumula_sobre_gastos_existentes_del_mes() {
    let mut repo = MemoryRepository::default();
    let mut snapshot = crate::domain::snapshot::FinanceSnapshot::new();
    let previo = crate::domain::monthly_record::MonthlyRecord::from_raw(
        "2026-06",
        &[("salario", 2_000.0)],
        &[("ocio", 100.0)],
    )
    .expect("registro previo");
    snapshot.monthly_records.push(previo);
    repo.stored = Some(snapshot);

    let aceptados = vec![aceptado(
        "2026-06-20",
        "CINE",
        -12.50,
        ExpenseCategory::Ocio,
    )];
    let resultado =
        confirmar_movimientos(&mut repo, "2026-06", &aceptados).expect("ok");
    let registro = registro_de(&resultado, "2026-06");
    assert_eq!(registro.gasto(ExpenseCategory::Ocio), Some(&112.50));
    // Los ingresos previos no se tocan.
    assert_eq!(registro.total_income(), 2_000.0);
}

#[test]
fn confirmar_propaga_fallo_de_guardado_sin_perder_el_error() {
    let mut repo = MemoryRepository::default();
    repo.stored = Some(crate::domain::snapshot::FinanceSnapshot::new());
    repo.fail_save = true;
    let aceptados = vec![aceptado(
        "2026-06-01",
        "TIENDA",
        -5.0,
        ExpenseCategory::Otros,
    )];
    let error = confirmar_movimientos(&mut repo, "2026-06", &aceptados)
        .expect_err("guardado inyectado fallido");
    assert_eq!(error.codigo(), "SnapshotError");
}
