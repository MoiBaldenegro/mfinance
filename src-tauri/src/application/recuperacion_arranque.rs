//! REQ-28-02..09 + REQ-30-02: autorecuperación determinista del arranque
//! cuando profiles.json YA existe (reglas R1-R4 del análisis §5.2).
//! Jamás borra ni reescribe datos de otros perfiles: solo repara el
//! indicador de activo y persiste la elección; R3 ya NO siembra seed
//! (la siembra se diferencia hasta completar_onboarding, REQ-30-03).

use crate::application::arranque_perfiles::arranke_frio;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::registro_perfiles::RegistroPerfiles;
use crate::domain::repository::SnapshotRepository;

/// Aplica R1-R4 sobre un registro existente. Devuelve true solo cuando
/// se ejecutó el flujo frío (alta del perfil inicial: regla R4).
pub fn recuperar<S>(
    store: &mut S,
    registro: RegistroPerfiles,
) -> Result<bool, PerfilError>
where
    S: PerfilRepository + SnapshotRepository,
{
    // R4: registro sin ningún perfil → flujo frío vigente (REQ-28-08).
    if registro.perfiles.is_empty() {
        return arranke_frio(store);
    }
    // R1: activo presente con snapshot en disco → nada que hacer.
    let sano = match &registro.activa {
        Some(id) => {
            registro.perfiles.iter().any(|p| &p.id == id)
                && store.tiene_snapshot(id)
        }
        None => false,
    };
    if sano {
        return Ok(false);
    }
    // R2: activa nula, huérfana o sin snapshot → PRIMER perfil del
    // registro con snapshot en disco; la elección se persiste
    // (REQ-28-05/06). Nunca toca los datos de los demás perfiles.
    let con_datos = registro
        .perfiles
        .iter()
        .map(|p| p.id.clone())
        .find(|id| store.tiene_snapshot(id));
    if let Some(id) = con_datos {
        store.guardar_registro(&RegistroPerfiles {
            activa: Some(id),
            perfiles: registro.perfiles,
        })?;
        return Ok(false);
    }
    // R3 REQ-30-02: nadie tiene snapshot legible → persistir el primer
    // perfil como activo y devolver Ok(false) SIN llamar ensure_seed.
    // La siembra se hará en completar_onboarding (REQ-30-03).
    store.guardar_registro(&RegistroPerfiles {
        activa: Some(registro.perfiles[0].id.clone()),
        perfiles: registro.perfiles,
    })?;
    Ok(false)
}