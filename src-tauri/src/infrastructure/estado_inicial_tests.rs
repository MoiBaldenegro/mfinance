//! Test REQ-28-04 del composition root: estado_inicial deja la sesión
//! de comprobantes operando bajo el id del perfil activo restaurado en
//! el repositorio (el mismo cable que sincroniza seleccionar_perfil).

use super::arranque28_soporte::{
    escribir_registro, escribir_snapshot, perfil, snapshot_con,
};
use super::test_support::{cleanup, temp_dir};
use crate::commands::AppState;
use crate::domain::puertos_pdf::ComprobantesStore;
use crate::domain::registro_perfiles::RegistroPerfiles;

#[test]
fn estado_inicial_sincroniza_comprobantes_con_el_activo_restaurado() {
    let base = temp_dir("f28_estado_inicial");
    escribir_snapshot(&base, "p_aaa", &snapshot_con(555.0));
    escribir_registro(
        &base,
        &RegistroPerfiles {
            activa: Some("p_aaa".to_string()),
            perfiles: vec![perfil("p_aaa", "Ana")],
        },
    );

    // Reinicio simulado: composition root completo sobre ese directorio.
    let state: AppState =
        crate::estado_inicial(base.clone()).expect("estado inicial");

    assert_eq!(
        state.repo.lock().expect("repo").activo(),
        Some("p_aaa"),
        "el repositorio quedó sobre el activo restaurado"
    );
    state
        .comprobantes
        .lock()
        .expect("comprobantes")
        .guardar("2026-08", "ticket.pdf", b"%PDF-fixture")
        .expect("REQ-28-04: comprobantes operativos tras el reinicio");
    assert!(
        base.join("comprobantes")
            .join("p_aaa")
            .join("2026-08")
            .join("ticket.pdf")
            .is_file(),
        "la ruta de comprobantes incluye el id del activo restaurado"
    );
    cleanup(&base);
}
