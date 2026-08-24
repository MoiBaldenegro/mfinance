//! Casos de uso del registro de perfiles (REQ-21-01/06): listar,
//! crear y seleccionar. Orquestan el puerto PerfilRepository con las
//! validaciones nombradas; sin filesystem ni IPC.

use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;

/// Lista los perfiles existentes; vacío si aún no hay registro.
pub fn listar(
    repo: &mut dyn PerfilRepository,
) -> Result<Vec<Perfil>, PerfilError> {
    Ok(repo
        .cargar_registro()?
        .map(|registro| registro.perfiles)
        .unwrap_or_default())
}

/// Devuelve el perfil activo del registro, si lo hay (REQ-22-02/04):
/// alimenta el indicador de la cabecera y la marca de la lista en UI.
pub fn activo(
    repo: &mut dyn PerfilRepository,
) -> Result<Option<Perfil>, PerfilError> {
    Ok(repo
        .cargar_registro()?
        .and_then(|registro| {
            let id = registro.activa?;
            registro
                .perfiles
                .into_iter()
                .find(|perfil| perfil.id == id)
        }))
}

/// Da de alta un perfil con nombre válido y único (REQ-21-06): rechaza
/// vacío o duplicado con error nombrado SIN alterar datos.
pub fn crear(
    repo: &mut dyn PerfilRepository,
    nombre: &str,
) -> Result<Perfil, PerfilError> {
    let limpio = nombre.trim();
    if limpio.is_empty() {
        return Err(PerfilError::NombreVacio);
    }
    let mut registro = repo.cargar_registro()?.unwrap_or_default();
    if registro.perfiles.iter().any(|p| p.nombre == limpio) {
        return Err(PerfilError::NombreDuplicado(limpio.to_string()));
    }
    let perfil = Perfil::nuevo(limpio);
    registro.perfiles.push(perfil.clone());
    repo.guardar_registro(&registro)?;
    Ok(perfil)
}

/// Activa el perfil cuyo id coincide; error nombrado si no existe.
/// A partir del guardado, los commands de estado operan sobre SU snapshot.
pub fn seleccionar(
    repo: &mut dyn PerfilRepository,
    id: &str,
) -> Result<Perfil, PerfilError> {
    let mut registro = repo.cargar_registro()?.ok_or_else(|| {
        PerfilError::PerfilInexistente(id.to_string())
    })?;
    let perfil = registro
        .perfiles
        .iter()
        .find(|p| p.id == id)
        .cloned()
        .ok_or_else(|| PerfilError::PerfilInexistente(id.to_string()))?;
    registro.activa = Some(perfil.id.clone());
    repo.guardar_registro(&registro)?;
    Ok(perfil)
}
