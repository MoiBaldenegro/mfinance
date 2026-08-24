//! Fachada del cierre mensual: operaciones de lectura sobre el puerto
//! (resumen del wizard y consejos vigentes). Las escrituras están en
//! `cierre_ops` y el bloqueo real en `save_state`.

use crate::application::cierre::errores::ErrorCierre;
use crate::application::cierre::promedio_movil::promedio_movil_3;
use crate::application::cierre::reglas::evaluar_recomendaciones;
use crate::application::cierre::tipos::{
    MesFlujo, PatrimonioActual, Recomendacion, ResumenCierre,
};
use crate::application::indicadores_engine::calcular_indicadores;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;

/// Resumen que alimenta los pasos Repaso y Presupuesto del wizard.
pub fn resumen_cierre(
    repository: &dyn SnapshotRepository,
    mes: &str,
) -> Result<ResumenCierre, ErrorCierre> {
    let snapshot = repository.load().map_err(ErrorCierre::Carga)?;
    Ok(resumen_del_snapshot(&snapshot, mes))
}

/// Consejos vigentes recalculados sobre los datos actuales (REQ-16-05).
pub fn consejos_vigentes(
    repository: &dyn SnapshotRepository,
) -> Result<Vec<Recomendacion>, ErrorCierre> {
    let snapshot = repository.load().map_err(ErrorCierre::Carga)?;
    Ok(evaluar_recomendaciones(&calcular_indicadores(&snapshot)))
}

/// Construye el resumen puro del wizard desde un snapshot cualquiera.
pub fn resumen_del_snapshot(
    snapshot: &FinanceSnapshot,
    mes: &str,
) -> ResumenCierre {
    ResumenCierre {
        mes: mes.to_string(),
        flujo: flujo(snapshot),
        patrimonio: patrimonio(snapshot),
        presupuesto_sugerido: promedio_movil_3(&snapshot.monthly_records),
        cerrado: snapshot.mes_cerrado(mes),
    }
}

fn flujo(snapshot: &FinanceSnapshot) -> Vec<MesFlujo> {
    let mut filas: Vec<MesFlujo> = snapshot
        .monthly_records
        .iter()
        .map(|registro| {
            let ingresos = registro.total_income();
            let gastos = registro.total_expense();
            MesFlujo {
                mes: registro.mes().as_str().to_string(),
                ingresos,
                gastos,
                utilidad: ingresos - gastos,
            }
        })
        .collect();
    filas.sort_by(|a, b| a.mes.cmp(&b.mes));
    filas
}

fn patrimonio(snapshot: &FinanceSnapshot) -> PatrimonioActual {
    let activos: f64 = snapshot.assets.iter().map(|a| a.valor_actual()).sum();
    let pasivos: f64 =
        snapshot.liabilities.iter().map(|l| l.saldo_pendiente()).sum();
    PatrimonioActual { activos, pasivos, patrimonio: activos - pasivos }
}
