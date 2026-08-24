//! Test REQ-21-04 del arranque sobre el adapter REAL con directorio
//! temporal: migración única del legado al primer perfil, backup
//! renombrado y no repetición en el segundo arranque.

use std::fs;

use super::test_support::{cleanup, temp_dir};
use crate::application::arranque_perfiles::preparar_arranque;
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::FinanceSnapshot;
use crate::infrastructure::json_repository::JsonSnapshotRepository;
use crate::seed;

/// Snapshot "legado" distinguible del seed vigente.
pub(crate) fn snapshot_legado() -> FinanceSnapshot {
    let mut legado = seed::example_snapshot();
    legado.strategy.extra_monthly_payment = 777.0;
    legado
}

#[test]
fn migra_el_legado_una_vez_con_backup_renombrado_y_no_repite() {
    let base = temp_dir("migracion");
    let ruta_legado = base.join("mfinance.json");
    let legado = snapshot_legado();
    fs::write(&ruta_legado, serde_json::to_string_pretty(&legado).unwrap())
        .unwrap();

    // Primer arranque: crea el primer perfil y adopta el legado.
    let mut store = JsonSnapshotRepository::new(base.clone());
    assert!(preparar_arranque(&mut store).expect("migración"));
    let registro = store.cargar_registro().expect("registro").expect("hay");
    assert_eq!(registro.perfiles.len(), 1, "un único perfil migrado");
    assert_eq!(registro.perfiles[0].nombre, "Personal");
    let id = registro.activa.clone().expect("activo");
    assert_eq!(registro.perfiles[0].id, id);

    // REQ-21-02: el snapshot del perfil contiene TODO el legado.
    let en_perfil = base.join("perfiles").join(&id).join("mfinance.json");
    let cargado: FinanceSnapshot =
        serde_json::from_str(&fs::read_to_string(&en_perfil).unwrap())
            .unwrap();
    assert_eq!(cargado, legado, "el legado viaja íntegro a su perfil");

    // REQ-21-04: backup renombrado y legado fuera del camino de carga.
    assert!(!ruta_legado.exists(), "el legado original se retira");
    let backup = base.join("mfinance.pre-perfiles.json");
    assert!(backup.is_file(), "queda copia de seguridad renombrada");
    assert_eq!(
        store.load().unwrap(),
        legado,
        "la carga del activo devuelve los datos migrados"
    );

    // Segundo arranque: NO repite la operación.
    assert!(!preparar_arranque(&mut store).expect("segundo arranque"));
    assert_eq!(
        store.cargar_registro().unwrap().unwrap().perfiles.len(),
        1,
        "no se crean perfiles extra"
    );
    assert!(backup.is_file(), "el backup permanece intacto");
    cleanup(&base);
}
