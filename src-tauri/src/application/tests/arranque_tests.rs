//! Tests REQ-21-04/05 + REQ-30-01 de preparar_arranque sobre dobles en memoria:
//! no repetir la operación con registro previo, NO seed inicial (REQ-30-01),
//! adopción del legado y bloqueo ante corrupto.

use super::memory_store_perfiles::MemoryStorePerfiles;
use crate::application::arranque_perfiles::preparar_arranque;
use crate::domain::perfil_errors::PerfilError;

#[test]
fn sin_nada_crea_el_perfil_inicial_sin_sembrar_seed() {
    // REQ-30-01: arranque_frio crea perfil Personal NotStarted SIN llamar ensure_seed
    let mut store = MemoryStorePerfiles::default();
    assert!(preparar_arranque(&mut store).expect("arranque frío"));
    let registro = store.perfiles.registro.expect("registro creado");
    assert_eq!(registro.perfiles.len(), 1, "un único perfil inicial");
    assert_eq!(registro.perfiles[0].nombre, "Personal");
    assert_eq!(
        registro.activa.as_deref(),
        Some(registro.perfiles[0].id.as_str()),
        "el inicial queda activo"
    );
    // REQ-30-01: NO hay snapshot sembrado (el seed se siembra en completar_onboarding)
    assert!(
        store.snapshots.stored.is_none(),
        "REQ-30-01: NO debe sembrar seed en arranque frío"
    );
    // Verificar onboarding_status = NotStarted
    assert_eq!(
        registro.perfiles[0].onboarding_status,
        crate::domain::onboarding::OnboardingStatus::NotStarted
    );
}

#[test]
fn con_registro_previo_no_repite_ni_alta_ni_siembra() {
    let mut store = MemoryStorePerfiles::default();
    // Primer arranque: crea perfil SIN seed
    assert!(preparar_arranque(&mut store).expect("primer arranque"));
    assert!(store.snapshots.stored.is_none(), "primer arranque sin seed");

    let snapshot_antes = store.snapshots.stored.clone();
    let perfiles_antes = store.perfiles.registro.as_ref().unwrap().perfiles.len();

    // Segundo arranque: no repite alta (perfiles sigue siendo 1)
    // Nota: autorecuperación R3 persiste el activo (guarda registro) pero no crea nuevo perfil
    assert!(!preparar_arranque(&mut store).expect("segundo arranque"));
    assert_eq!(store.perfiles.registro.unwrap().perfiles.len(), perfiles_antes, "sin nueva alta de perfil");
    assert_eq!(
        store.snapshots.stored, snapshot_antes,
        "snapshot sigue sin sembrar"
    );
}

#[test]
fn con_legado_pendiente_lo_adopta_al_primer_perfil_sin_sembrar() {
    let mut store = MemoryStorePerfiles::default();
    store.perfiles.legado_pendiente = true;
    assert!(preparar_arranque(&mut store).expect("migración"));
    let registro = store.perfiles.registro.expect("registro creado");
    assert_eq!(registro.perfiles.len(), 1);
    assert_eq!(
        store.perfiles.adoptados,
        vec![registro.activa.clone().expect("activa")],
        "el legado se adopta al perfil que queda activo"
    );
    // REQ-30-01 + REQ-21-04: el legado ya está en su ruta, NO se siembra seed encima
    assert!(
        store.snapshots.stored.is_none(),
        "el legado adoptado está en su ruta: no hay seed adicional"
    );
}

#[test]
fn registro_corrupto_bloquea_el_arranque_sin_escribir_nada() {
    let mut store = MemoryStorePerfiles::default();
    store.perfiles.corrupto = true;
    let error = preparar_arranque(&mut store).expect_err("debe bloquear");
    assert!(matches!(error, PerfilError::RegistroCorrupto(_)));
    assert!(
        store.perfiles.guardados.is_empty(),
        "ante un registro corrupto no se escribe nada"
    );
}