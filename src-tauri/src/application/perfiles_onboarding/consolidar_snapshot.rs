//! REQ-27-06: consolida el onboarding en el SNAPSHOT del perfil activo:
//! StrategySettings (currency, debt_strategy, extra_monthly_payment) e
//! Investment.tasa_esperada por familia. El perfil debe quedar activo
//! antes de llamar aquí para que load/save resuelvan SU ruta.

use crate::domain::investment::{Investment, InvestmentFamily};
use crate::domain::onboarding::{Paso2Data, Paso3Data};
use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::{DebtStrategy, FinanceSnapshot};

/// Completa el onboarding y consolida además el snapshot del perfil.
/// Orden: activar → completar → consolidar, para que la ruta del
/// snapshot resuelva la del perfil finalizado.
pub fn completar_onboarding_con_snapshot(
    repo: &mut dyn PerfilRepository,
    snapshots: &mut dyn SnapshotRepository,
    perfil_id: &str,
) -> Result<Perfil, PerfilError> {
    super::super::perfiles::seleccionar(repo, perfil_id)?;
    let perfil = super::completar_onboarding(repo, perfil_id)?;
    consolidar_snapshot(snapshots, &perfil)?;
    Ok(perfil)
}

/// Carga el snapshot vigente (ya es el del activo), aplica y persiste.
fn consolidar_snapshot(
    snapshots: &mut dyn SnapshotRepository,
    perfil: &Perfil,
) -> Result<(), PerfilError> {
    let mut snapshot = snapshots.load().map_err(|error| {
        PerfilError::Persistencia(format!(
            "no se pudo cargar el snapshot del perfil: {error}"
        ))
    })?;
    aplicar_onboarding_a_snapshot(&mut snapshot, perfil);
    snapshots.save(&snapshot).map_err(|error| {
        PerfilError::Persistencia(format!(
            "no se pudo guardar el snapshot consolidado: {error}"
        ))
    })
}

/// Aplica los datos capturados al snapshot; lo ausente queda como esté.
pub fn aplicar_onboarding_a_snapshot(
    snapshot: &mut FinanceSnapshot,
    perfil: &Perfil,
) {
    let data = &perfil.onboarding_data;
    if let Some(p1) = &data.paso1 {
        snapshot.strategy.currency = p1.moneda;
    }
    if let Some(p3) = &data.paso3 {
        aplicar_estrategia(&mut snapshot.strategy.debt_strategy, p3);
        if let Some(extra) = p3.pago_extra_mensual {
            snapshot.strategy.extra_monthly_payment = extra;
        }
    }
    if let Some(p2) = &data.paso2 {
        aplicar_tasas_inversion(snapshot, p2);
    }
}

/// Estrategia del paso 3; una clave fuera de catálogo conserva la vigente.
fn aplicar_estrategia(destino: &mut DebtStrategy, p3: &Paso3Data) {
    match p3.estrategia_deuda.as_deref() {
        Some("Avalanche") => *destino = DebtStrategy::Avalanche,
        Some("Snowball") => *destino = DebtStrategy::Snowball,
        _ => {}
    }
}

/// Fusiona las tasas del paso 2: familia existente actualiza SOLO su
/// tasa esperada (aporte/valor quedan como estén); familia nueva se añade.
fn aplicar_tasas_inversion(snapshot: &mut FinanceSnapshot, p2: &Paso2Data) {
    for inv in &p2.inversiones {
        let Ok(familia) = InvestmentFamily::parse(&inv.familia) else {
            continue;
        };
        let existente =
            snapshot.investments.iter_mut().find(|i| i.familia() == familia);
        if let Some(actual) = existente {
            if let Ok(nueva) = Investment::new(
                familia,
                actual.aporte_mensual(),
                actual.valor_actual(),
                inv.tasa_esperada_anual,
            ) {
                *actual = nueva;
            }
        } else if let Ok(nueva) = Investment::new(
            familia, inv.aporte_mensual, inv.valor_actual, inv.tasa_esperada_anual,
        ) {
            snapshot.investments.push(nueva);
        }
    }
}
