//! Operaciones de escritura del cierre mensual (REQ-16-03/07): cerrar un
//! mes genera y persiste su assessment; reabrir lo elimina de forma
//! explícita. Ambas cargan, mutan y persisten vía el puerto.

use crate::application::cierre::errores::ErrorCierre;
use crate::application::cierre::fecha::fecha_iso_hoy;
use crate::application::cierre::peticion::PeticionCierre;
use crate::application::indicadores_engine::calcular_indicadores;
use crate::domain::month_key::MonthKey;
use crate::domain::monthly_assessment::{IndicadorCerrado, MonthlyAssessment};
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;

/// Cierra el mes: marca el cierre persistiendo el assessment con fecha,
/// indicadores congelados y presupuesto decidido para el mes siguiente.
pub fn cerrar_mes(
    repository: &mut dyn SnapshotRepository,
    peticion: &PeticionCierre,
) -> Result<FinanceSnapshot, ErrorCierre> {
    let mut snapshot = repository.load().map_err(ErrorCierre::Carga)?;
    if snapshot.mes_cerrado(&peticion.mes) {
        return Err(ErrorCierre::MesYaCerrado(peticion.mes.clone()));
    }
    let mes = MonthKey::parse(&peticion.mes)
        .map_err(|_| ErrorCierre::MesInvalido(peticion.mes.clone()))?;
    let indicadores = congelar_indicadores(&calcular_indicadores(&snapshot));
    let assessment = MonthlyAssessment::nuevo(
        mes,
        &fecha_iso_hoy(),
        indicadores,
        peticion.presupuesto_siguiente.clone(),
    );
    snapshot.assessments.push(assessment);
    repository.save(&snapshot).map_err(ErrorCierre::Guardado)?;
    Ok(snapshot)
}

/// Reabre explícitamente un mes cerrado eliminando su assessment.
pub fn reabrir_mes(
    repository: &mut dyn SnapshotRepository,
    mes: &str,
) -> Result<FinanceSnapshot, ErrorCierre> {
    let mut snapshot = repository.load().map_err(ErrorCierre::Carga)?;
    if !snapshot.mes_cerrado(mes) {
        return Err(ErrorCierre::MesNoCerrado(mes.to_string()));
    }
    snapshot.assessments.retain(|a| a.mes().as_str() != mes);
    repository.save(&snapshot).map_err(ErrorCierre::Guardado)?;
    Ok(snapshot)
}

/// Congela los cuatro indicadores como foto inmutable del cierre.
fn congelar_indicadores(
    indicadores: &crate::application::indicadores_types::Indicadores,
) -> Vec<IndicadorCerrado> {
    let lista = [
        &indicadores.endeudamiento,
        &indicadores.tasa_ahorro,
        &indicadores.fondo_emergencia,
        &indicadores.ingreso_pasivo,
    ];
    lista
        .iter()
        .map(|r| IndicadorCerrado {
            nombre: r.nombre.clone(),
            valor: if r.sin_datos { None } else { Some(r.valor) },
            clasificacion: if r.sin_datos {
                "sin_datos".to_string()
            } else {
                match r.clasificacion {
                    crate::application::indicadores_types::Semaphore::Verde => "verde".into(),
                    crate::application::indicadores_types::Semaphore::Amarillo => "amarillo".into(),
                    crate::application::indicadores_types::Semaphore::Rojo => "rojo".into(),
                }
            },
        })
        .collect()
}
