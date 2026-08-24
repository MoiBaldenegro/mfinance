//! REQ-27-06 (ruta IPC real): finaliza el onboarding cuando UN adaptador
//! implanta ambos puertos (`JsonSnapshotRepository` es a la vez
//! `PerfilRepository` y `SnapshotRepository`). Sobre un único objeto no
//! pueden vivir dos `&mut` simultáneos, así que la secuencia
//! activar → completar → consolidar encadena préstamos secuenciales.

use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;

/// Variante de `completar_onboarding_con_snapshot` para la ruta de los
/// commands, donde perfiles y snapshots viven en el mismo adapter: deja
/// el perfil ACTIVO, Completed y con su snapshot consolidado.
pub fn completar_onboarding_en_adaptador<R>(
    repo: &mut R,
    perfil_id: &str,
) -> Result<Perfil, PerfilError>
where
    R: PerfilRepository + SnapshotRepository,
{
    super::super::perfiles::seleccionar(repo, perfil_id)?;
    let perfil = super::completar::completar_onboarding(repo, perfil_id)?;
    consolidar(repo, &perfil)?;
    Ok(perfil)
}

/// Carga el snapshot del titular ya activo (vacío si aún no tiene
/// archivo: perfil recién creado) y consolida en él lo capturado.
fn consolidar<R: SnapshotRepository>(
    snapshots: &mut R,
    perfil: &Perfil,
) -> Result<(), PerfilError> {
    let mut snapshot: FinanceSnapshot = snapshots.load().unwrap_or_default();
    super::consolidar_snapshot::aplicar_onboarding_a_snapshot(&mut snapshot, perfil);
    snapshots.save(&snapshot).map_err(|error| {
        PerfilError::Persistencia(format!(
            "no se pudo guardar el snapshot consolidado: {error}"
        ))
    })
}
