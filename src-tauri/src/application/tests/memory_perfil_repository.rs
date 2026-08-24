//! Doble en memoria del puerto PerfilRepository (REQ-21): registro
//! opcional, fallos inyectables y trazas de guardados/adopciones para
//! verificar que las operaciones fallidas no alteran datos.

use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::registro_perfiles::RegistroPerfiles;

/// Doble del registro de perfiles con fallos inyectables.
#[derive(Default)]
pub struct MemoryPerfilRepository {
    pub registro: Option<RegistroPerfiles>,
    pub corrupto: bool,
    pub fallo_guardado: bool,
    pub legado_pendiente: bool,
    pub guardados: Vec<RegistroPerfiles>,
    pub adoptados: Vec<String>,
    /// Ids cuyo snapshot «existe en disco» (REQ-28-05/06): los dobles
    /// deben modelarlo para poder probar la autorecuperación.
    pub snapshots_presentes: Vec<String>,
}

impl PerfilRepository for MemoryPerfilRepository {
    fn cargar_registro(
        &mut self,
    ) -> Result<Option<RegistroPerfiles>, PerfilError> {
        if self.corrupto {
            return Err(PerfilError::RegistroCorrupto(
                "profiles.json no es un registro válido".to_string(),
            ));
        }
        Ok(self.registro.clone())
    }

    fn guardar_registro(
        &mut self,
        registro: &RegistroPerfiles,
    ) -> Result<(), PerfilError> {
        if self.fallo_guardado {
            return Err(PerfilError::Persistencia("fallo inyectado".into()));
        }
        self.guardados.push(registro.clone());
        self.registro = Some(registro.clone());
        Ok(())
    }

    fn tiene_snapshot(&self, perfil_id: &str) -> bool {
        self.snapshots_presentes.iter().any(|id| id == perfil_id)
    }

    fn legacy_pendiente(&self) -> bool {
        self.legado_pendiente
    }

    fn adoptar_legacy(&mut self, destino: &Perfil) -> Result<(), PerfilError> {
        self.adoptados.push(destino.id.clone());
        Ok(())
    }
}

impl MemoryPerfilRepository {
    /// Constructor para tests.
    pub fn new() -> Self {
        Self::default()
    }

    /// Helper para tests: crea un perfil y devuelve su id.
    pub fn crear(&mut self, nombre: &str) -> Result<Perfil, PerfilError> {
        crate::application::perfiles::crear(self, nombre)
    }

    /// Helper para tests: obtiene un perfil por id.
    pub fn obtener(&self, id: &str) -> Option<Perfil> {
        self.registro.as_ref()?.perfiles.iter().find(|p| p.id == id).cloned()
    }
}
