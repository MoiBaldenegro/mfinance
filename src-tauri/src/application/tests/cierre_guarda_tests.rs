//! Tests del guard de meses cerrados en save_state (REQ-16-07): el
//! bloqueo del registro mensual es real, no cosmético.

use crate::application::cierre::cierre_ops::cerrar_mes;
use crate::application::save_state::save_state;
use crate::application::tests::cierre_fixtures::{peticion, repo_con, registro, snapshot_base};
use crate::application::tests::memory_repository::MemoryRepository;
use crate::domain::repository::SnapshotRepository;

#[test]
fn guardar_un_cambio_sobre_mes_cerrado_se_rechaza_de_verdad() {
    let mut repo: MemoryRepository = repo_con(snapshot_base());
    cerrar_mes(&mut repo, &peticion()).expect("cierre");
    let mut entrante = repo.load().expect("vigente");
    let ultimo = entrante.monthly_records.last_mut().expect("registro 2026-07");
    *ultimo = registro("2026-07", &[("salario", 9999.0)], &[]);
    let resultado = save_state(&mut repo, &entrante);
    let error = resultado.expect_err("el guard debe rechazar el cambio");
    assert!(error.reason.contains("2026-07"), "{}", error.reason);
    assert!(error.reason.contains("cerrado"), "{}", error.reason);
    // El estado vigente queda intacto (sin la edición prohibida).
    let vigente = repo.load().expect("vigente");
    assert_eq!(vigente.monthly_records[2].total_income(), 3000.0);
}

#[test]
fn guardar_sin_tocar_meses_cerrados_pasa_aunque_haya_cierres() {
    let mut repo: MemoryRepository = repo_con(snapshot_base());
    cerrar_mes(&mut repo, &peticion()).expect("cierre");
    let mut entrante = repo.load().expect("vigente");
    entrante.assets.clear();
    assert!(save_state(&mut repo, &entrante).is_ok());
}

#[test]
fn guardar_no_puede_desbloquear_borrando_la_lista_de_cierres() {
    let mut repo: MemoryRepository = repo_con(snapshot_base());
    cerrar_mes(&mut repo, &peticion()).expect("cierre");
    let mut entrante = repo.load().expect("vigente");
    entrante.assessments.clear();
    let resultado = save_state(&mut repo, &entrante);
    assert!(resultado.is_err(), "borrar cierres por save debe fallar");
}
