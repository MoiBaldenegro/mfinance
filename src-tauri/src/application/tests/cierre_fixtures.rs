//! Dobles y constructores compartidos por los tests del cierre mensual.

use crate::application::cierre::peticion::PeticionCierre;
use crate::application::tests::memory_repository::MemoryRepository;
use crate::domain::catalogs::ExpenseCategory;
use crate::domain::monthly_record::MonthlyRecord;
use crate::domain::snapshot::FinanceSnapshot;

/// Registro mensual válido desde claves crudas.
pub fn registro(
    mes: &str,
    ingresos: &[(&str, f64)],
    gastos: &[(&str, f64)],
) -> MonthlyRecord {
    MonthlyRecord::from_raw(mes, ingresos, gastos).expect("registro válido")
}

/// Snapshot de tres meses de flujo coherente sin activos ni pasivos.
pub fn snapshot_base() -> FinanceSnapshot {
    let mut snapshot = FinanceSnapshot::new();
    snapshot.monthly_records = vec![
        registro("2026-05", &[("salario", 3000.0)], &[("vivienda", 900.0)]),
        registro(
            "2026-06",
            &[("salario", 3000.0)],
            &[("vivienda", 1000.0), ("ocio", 200.0)],
        ),
        registro(
            "2026-07",
            &[("salario", 3000.0)],
            &[("vivienda", 1100.0), ("ocio", 300.0)],
        ),
    ];
    snapshot
}

/// Repositorio en memoria sembrado con el snapshot dado.
pub fn repo_con(snapshot: FinanceSnapshot) -> MemoryRepository {
    let mut repo = MemoryRepository::default();
    repo.stored = Some(snapshot);
    repo
}

/// Petición de cierre de 2026-07 con presupuesto para 2026-08.
pub fn peticion() -> PeticionCierre {
    let mut presupuesto = std::collections::BTreeMap::new();
    presupuesto.insert(ExpenseCategory::Vivienda, 1000.0);
    PeticionCierre { mes: "2026-07".into(), presupuesto_siguiente: presupuesto }
}
