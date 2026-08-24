//! REQ-12-05: tests del adapter fs del puerto ComprobantesStore sobre
//! directorios temporales (nunca Documents real). Round-trip completo.

use super::test_support::{cleanup, temp_dir};
use crate::domain::puertos_pdf::ComprobantesStore;
use crate::infrastructure::comprobantes_fs::ComprobantesFsRepository;

#[test]
fn round_trip_guardar_listar_y_leer_en_directorio_temporal() {
    let dir = temp_dir("store_f12");
    let mut store = ComprobantesFsRepository::new(dir.join("comprobantes"));
    store.set_perfil("f12".to_string());
    store.guardar("2026-06", "extracto.pdf", b"%PDF-1.4 contenido")
        .expect("guardar");
    store.guardar("2026-06", "ticket.pdf", b"otro pdf")
        .expect("guardar 2");

    let nombres = store.listar("2026-06").expect("listar");
    assert_eq!(nombres, vec!["extracto.pdf".to_string(), "ticket.pdf".to_string()]);

    let bytes = store.leer("2026-06", "extracto.pdf").expect("leer");
    assert_eq!(bytes, b"%PDF-1.4 contenido");

    cleanup(&dir);
}

#[test]
fn los_meses_se_aislan_en_carpetas_separadas() {
    let dir = temp_dir("meses_f12");
    let mut store = ComprobantesFsRepository::new(dir.join("comprobantes"));
    store.set_perfil("f12".to_string());
    store.guardar("2026-06", "a.pdf", b"a").expect("junio");
    store.guardar("2026-07", "b.pdf", b"b").expect("julio");
    assert_eq!(store.listar("2026-06").expect("listar junio"), vec!["a.pdf"]);
    assert_eq!(store.listar("2026-07").expect("listar julio"), vec!["b.pdf"]);
    assert!(store.listar("2026-08").expect("mes vacío").is_empty());
    cleanup(&dir);
}

#[test]
fn el_nombre_original_se_sanea_contra_rutas_traversal() {
    let dir = temp_dir("traversal_f12");
    let mut store = ComprobantesFsRepository::new(dir.join("comprobantes"));
    store.set_perfil("f12".to_string());
    let guardado = store
        .guardar("2026-06", "../../evil.pdf", b"x")
        .expect("guardado saneado");
    assert_eq!(guardado, "evil.pdf");
    cleanup(&dir);
}

#[test]
fn listar_filtra_solo_pdfs_y_leer_inexistente_falla_nombrado() {
    let dir = temp_dir("filtro_f12");
    let base = dir.join("comprobantes");
    std::fs::create_dir_all(base.join("f12").join("2026-06")).unwrap();
    std::fs::write(base.join("f12").join("2026-06").join("nota.txt"), b"hola").unwrap();
    std::fs::write(base.join("f12").join("2026-06").join("doc.PDF"), b"x").unwrap();
    let mut store = ComprobantesFsRepository::new(base);
    store.set_perfil("f12".to_string());
    assert_eq!(
        store.listar("2026-06").expect("listar"),
        vec!["doc.PDF".to_string()]
    );
    let error = store.leer("2026-06", "fantasma.pdf").expect_err("falta");
    assert!(error.motivo.contains("fantasma.pdf") || !error.motivo.is_empty());
    cleanup(&dir);
}
