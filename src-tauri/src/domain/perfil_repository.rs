//! Puerto del registro de perfiles definido por el núcleo (REQ-21-01):
//! los adapters de infrastructure/ lo implementan; dominio y casos de
//! uso no conocen detalles de filesystem.

use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::registro_perfiles::RegistroPerfiles;

/// Puerto de persistencia del registro de perfiles (profiles.json).
pub trait PerfilRepository {
    /// Devuelve el registro guardado, o `None` si aún no existe archivo.
    /// Un archivo presente pero inválido es error nombrado (REQ-21-06).
    /// Al leerlo, el adapter restaura en su memoria el activo
    /// persistido (REQ-28-01); por eso necesita `&mut self`.
    fn cargar_registro(
        &mut self,
    ) -> Result<Option<RegistroPerfiles>, PerfilError>;

    /// Persiste el registro completo junto a su indicador de activo.
    fn guardar_registro(
        &mut self,
        registro: &RegistroPerfiles,
    ) -> Result<(), PerfilError>;

    /// True si el snapshot del perfil indicado existe en disco
    /// (REQ-28-05/06): consulta para la autorecuperación del arranque,
    /// sin que la capa de aplicación toque el filesystem.
    fn tiene_snapshot(&self, perfil_id: &str) -> bool;

    /// True si existe el mfinance.json legado aún sin migrar (REQ-21-04).
    fn legacy_pendiente(&self) -> bool;

    /// Copia el legado a la carpeta del perfil indicado y renombra el
    /// original como copia de seguridad (`mfinance.pre-perfiles.json`).
    fn adoptar_legacy(&mut self, destino: &Perfil) -> Result<(), PerfilError>;
}
