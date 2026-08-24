//! REQ-12-12: confirmar_movimientos CREANDO el registro del mes desde
//! cero. La acumulación sobre un mes existente y los errores nombrados de
//! persistencia viven en diagnostico_confirmar_acumulacion_tests.rs.

use super::diagnostico_fixtures::{aceptado, registro_de};
use super::memory_repository::MemoryRepository;
use crate::application::diagnostico::confirmar_movimientos;
use crate::domain::catalogs::ExpenseCategory;
use crate::domain::repository::SnapshotRepository;

#[test]
fn confirmar_crea_el_registro_del_mes_y_persiste_el_snapshot() {
    let mut repo = MemoryRepository::default();
    repo.stored = Some(crate::domain::snapshot::FinanceSnapshot::new());
    let aceptados = vec![
        aceptado(
            "2026-06-01",
            "SUPERMERCADO",
            -45.30,
            ExpenseCategory::Alimentacion,
        ),
        aceptado("2026-06-05", "GASOLINA", -23.75, ExpenseCategory::Transporte),
    ];
    let snapshot =
        confirmar_movimientos(&mut repo, "2026-06", &aceptados).expect("confirmar");
    let registro = registro_de(&snapshot, "2026-06");
    assert_eq!(
        registro.gasto(ExpenseCategory::Alimentacion),
        Some(&45.30)
    );
    assert_eq!(registro.gasto(ExpenseCategory::Transporte), Some(&23.75));
    // Persistido en el puerto: load devuelve exactamente lo guardado.
    let recargado = repo.load().expect("recarga");
    assert_eq!(recargado, snapshot);
}

#[test]
fn confirmar_rechaza_mes_invalido_con_error_nombrado() {
    let mut repo = MemoryRepository::default();
    repo.stored = Some(crate::domain::snapshot::FinanceSnapshot::new());
    let error = confirmar_movimientos(&mut repo, "junio-2026", &[])
        .expect_err("mes inválido");
    assert_eq!(error.codigo(), "MesInvalidoError");
}
