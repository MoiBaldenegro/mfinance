//! REQ-21-01/04 + REQ-28-01: adapter del puerto PerfilRepository sobre
//! profiles.json. LEER el registro restaura el activo persistido en la
//! memoria del adapter (REQ-28-01) y guardarlo lo fija (REQ-21-03),
//! así las operaciones de snapshot resuelven SU ruta tras un reinicio.

use std::fs;
use std::path::Path;

use crate::domain::perfil::Perfil;
use crate::domain::perfil_errors::PerfilError;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::registro_perfiles::RegistroPerfiles;
use crate::infrastructure::json_file;
use crate::infrastructure::json_repository::JsonSnapshotRepository;
use crate::infrastructure::rutas_mfinance;

impl PerfilRepository for JsonSnapshotRepository {
    fn cargar_registro(
        &mut self,
    ) -> Result<Option<RegistroPerfiles>, PerfilError> {
        let ruta = rutas_mfinance::registro(&self.base);
        if !ruta.is_file() {
            return Ok(None);
        }
        let raw = fs::read_to_string(&ruta).map_err(|error| {
            PerfilError::Persistencia(format!(
                "no se pudo leer {}: {error}",
                ruta.display()
            ))
        })?;
        serde_json::from_str::<RegistroPerfiles>(&raw)
            .map(|registro| {
                // REQ-28-01: el activo vuelve a vivir en el adapter.
                self.activo = registro.activa.clone();
                Some(registro)
            })
            .map_err(|error| {
                PerfilError::RegistroCorrupto(format!(
                    "{}: {error}",
                    ruta.display()
                ))
            })
    }

    fn guardar_registro(
        &mut self,
        registro: &RegistroPerfiles,
    ) -> Result<(), PerfilError> {
        let ruta = rutas_mfinance::registro(&self.base);
        json_file::write_atomic(&ruta, registro)
            .map_err(PerfilError::Persistencia)?;
        // REQ-21-03: el activo queda vivo en el adapter para resolver
        // la ruta de los snapshots a partir de este instante.
        self.activo = registro.activa.clone();
        Ok(())
    }

    /// REQ-28-05/06: ¿existe el snapshot del perfil en disco?
    fn tiene_snapshot(&self, perfil_id: &str) -> bool {
        rutas_mfinance::snapshot_de(&self.base, perfil_id).is_file()
    }

    fn legacy_pendiente(&self) -> bool {
        rutas_mfinance::legado(&self.base).is_file()
    }

    fn adoptar_legacy(&mut self, destino: &Perfil) -> Result<(), PerfilError> {
        adoptar_legado(&self.base, &destino.id)
    }
}

/// Copia el legado a la carpeta del perfil y renombra el original
/// como backup (REQ-21-04): si algo falla, el original queda intacto.
fn adoptar_legado(base: &Path, perfil_id: &str) -> Result<(), PerfilError> {
    let origen = rutas_mfinance::legado(base);
    let destino = rutas_mfinance::snapshot_de(base, perfil_id);
    if let Some(padre) = destino.parent() {
        fs::create_dir_all(padre).map_err(|error| {
            PerfilError::Persistencia(format!(
                "no se pudo crear {}: {error}",
                padre.display()
            ))
        })?;
    }
    fs::copy(&origen, &destino).map_err(|error| {
        PerfilError::Persistencia(format!(
            "no se pudo copiar el legado a {}: {error}",
            destino.display()
        ))
    })?;
    let backup = rutas_mfinance::backup_legado(base);
    fs::rename(&origen, &backup).map_err(|error| {
        PerfilError::Persistencia(format!(
            "no se pudo crear la copia de seguridad {}: {error}",
            backup.display()
        ))
    })?;
    Ok(())
}
