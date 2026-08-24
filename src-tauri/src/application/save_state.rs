//! Caso de uso save_state: persiste un snapshot como estado vigente a
//! través del puerto inyectado. Antes de guardar verifica el guard de
//! meses cerrados (REQ-16-07): bloqueo REAL, no cosmético.

use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotSaveError;
use crate::domain::snapshot::FinanceSnapshot;

/// Guarda el snapshot recibido como nuevo estado vigente.
///
/// REQ-16-07: mientras un mes está cerrado su MonthlyRecord es solo
/// lectura; si el snapshot entrante altera el registro de un mes cerrado
/// sin reabrirlo antes, se rechaza con error nombrado y no se persiste.
pub fn save_state(
    repository: &mut dyn SnapshotRepository,
    snapshot: &FinanceSnapshot,
) -> Result<(), SnapshotSaveError> {
    // Si el vigente no puede leerse (p. ej. primer guardado del ciclo)
    // no hay cierres que proteger y se permite persistir; con estado
    // legible, el guard de meses cerrados es estricto.
    if let Ok(vigente) = repository.load() {
        validar_registros_cerrados(&vigente, snapshot)?;
    }
    repository.save(snapshot)
}

/// Rechaza cambios en los registros de meses cerrados (REQ-16-07).
fn validar_registros_cerrados(
    vigente: &FinanceSnapshot,
    nuevo: &FinanceSnapshot,
) -> Result<(), SnapshotSaveError> {
    // La lista de cierres solo puede cambiar vía cerrar_mes/reabrir_mes:
    // así no se "desbloquea" un mes borrando su assessment por la puerta
    // de atrás de un guardado completo.
    if vigente.assessments != nuevo.assessments {
        return Err(SnapshotSaveError::new(
            "los cierres mensuales solo cambian con «Cerrar mes» o «Reabrir mes»",
        ));
    }
    for mes_cerrado in &vigente.assessments {
        let clave = mes_cerrado.mes().as_str();
        let antes = vigente.monthly_records.iter().find(|r| r.mes().as_str() == clave);
        let ahora = nuevo.monthly_records.iter().find(|r| r.mes().as_str() == clave);
        if antes != ahora {
            return Err(SnapshotSaveError::new(&format!(
                "el mes {clave} está cerrado: reábrelo explícitamente para poder editarlo"
            )));
        }
    }
    Ok(())
}
