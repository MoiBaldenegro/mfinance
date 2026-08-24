//! REQ-21-04/05 + REQ-28-02 + REQ-30-01: preparación del almacenamiento al
//! arrancar. Sin registro: flujo frío vigente (migración única del
//! legado SIN seed; el seed se diferencia hasta completar_onboarding).
//! Con registro: autorecuperación determinista R1-R4
//! (application/recuperacion_arranque.rs) que deja el repositorio
//! operativo sin repetir altas ni migraciones.

use crate::application::recuperacion_arranque::recuperar;
use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::registro_perfiles::RegistroPerfiles;
use crate::domain::repository::SnapshotRepository;

/// Nombre del primer perfil (migrado o sembrado).
const NOMBRE_INICIAL: &str = "Personal";

/// Prepara el arranque: true solo cuando se dio de alta el perfil
/// inicial (flujo frío); false si el registro ya existía, sano o
/// autorreparado. Jamás repite alta ni migración del legado
/// (REQ-21-04) y restaura la operación tras un reinicio (REQ-28-02).
pub fn preparar_arranque<S>(store: &mut S) -> Result<bool, PerfilError>
where
    S: PerfilRepository + SnapshotRepository,
{
    match store.cargar_registro()? {
        Some(registro) => recuperar(store, registro),
        None => arranke_frio(store),
    }
}

/// Flujo frío REQ-30-01: da de alta el primer perfil «Personal» con
/// onboarding_status = NotStarted, adoptando el legado pendiente
/// (con backup renombrado) SIN sembrar seed (el seed se siembra en
/// completar_onboarding, REQ-30-03).
pub fn arranke_frio<S>(store: &mut S) -> Result<bool, PerfilError>
where
    S: PerfilRepository + SnapshotRepository,
{
    let perfil = Perfil::nuevo(NOMBRE_INICIAL); // NotStarted por defecto (REQ-23-10)
    let hubo_legado = store.legacy_pendiente();
    if hubo_legado {
        store.adoptar_legacy(&perfil)?;
    }
    store.guardar_registro(&RegistroPerfiles {
        activa: Some(perfil.id.clone()),
        perfiles: vec![perfil],
    })?;
    // REQ-30-01: NO llamar ensure_seed aquí; la siembra se diferencia
    // hasta completar_onboarding (REQ-30-03).
    Ok(true)
}