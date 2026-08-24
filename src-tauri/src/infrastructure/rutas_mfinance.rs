//! Rutas canónicas del árbol de almacenamiento bajo Documents/mfinance
//! (REQ-21-02; layout en progress/research/config-monedas-perfiles.md
//! §5): un único sitio define cada ruta para que adapter y tests
//! coincidan siempre.

use std::path::{Path, PathBuf};

/// profiles.json: registro de perfiles e indicador del activo.
pub fn registro(base: &Path) -> PathBuf {
    base.join("profiles.json")
}

/// mfinance.json legado pre-perfiles (tras migrar queda como backup).
pub fn legado(base: &Path) -> PathBuf {
    base.join("mfinance.json")
}

/// Copia de seguridad renombrada de la migración única (REQ-21-04).
pub fn backup_legado(base: &Path) -> PathBuf {
    base.join("mfinance.pre-perfiles.json")
}

/// Snapshot completo del perfil indicado: perfiles/<id>/mfinance.json.
pub fn snapshot_de(base: &Path, perfil_id: &str) -> PathBuf {
    base.join("perfiles").join(perfil_id).join("mfinance.json")
}
