//! Tests de la fachada del cierre mensual (REQ-16-01/03/08): resumen del
//! wizard, cerrar el mes y reabrirlo explícitamente.

use crate::application::cierre::cierre_ops::{cerrar_mes, reabrir_mes};
use crate::application::cierre::errores::ErrorCierre;
use crate::application::cierre::fachada::resumen_cierre;
use crate::application::tests::cierre_fixtures::{peticion, repo_con, snapshot_base};
use crate::application::tests::memory_repository::MemoryRepository;
use crate::domain::catalogs::ExpenseCategory;

#[test]
fn el_resumen_expone_flujo_patrimonio_y_presupuesto_sugerido() {
    let repo = repo_con(snapshot_base());
    let resumen = resumen_cierre(&repo, "2026-07").expect("resumen");
    assert_eq!(resumen.mes, "2026-07");
    // Flujo: los tres meses con utilidad calculada.
    assert_eq!(resumen.flujo.len(), 3);
    assert_eq!(resumen.flujo[2].mes, "2026-07");
    assert!((resumen.flujo[2].utilidad - (3000.0 - 1400.0)).abs() < 1e-9);
    // Patrimonio sin activos ni pasivos: ceros.
    assert_eq!(resumen.patrimonio.patrimonio, 0.0);
    // Presupuesto sugerido: promedio móvil de vivienda (900+1000+1100)/3.
    let sugerido = resumen.presupuesto_sugerido.get(&ExpenseCategory::Vivienda);
    assert!((sugerido.unwrap() - 1000.0).abs() < 1e-9);
    assert!(!resumen.cerrado);
}

#[test]
fn cerrar_marca_el_mes_cerrado_y_persiste_el_assessment() {
    let mut repo: MemoryRepository = repo_con(snapshot_base());
    let nuevo = cerrar_mes(&mut repo, &peticion()).expect("cierre");
    assert_eq!(nuevo.assessments.len(), 1);
    let assessment = &nuevo.assessments[0];
    assert_eq!(assessment.mes().as_str(), "2026-07");
    assert_eq!(assessment.fecha_cierre().len(), "2026-08-22".len());
    assert_eq!(
        assessment.presupuesto_siguiente().get(&ExpenseCategory::Vivienda),
        Some(&1000.0)
    );
    // Persistido en el repositorio y consultable como histórico.
    let vigente = repo.stored.as_ref().expect("estado persistido");
    assert!(vigente.mes_cerrado("2026-07"));
    assert_eq!(vigente.historico_cierres().len(), 1);
}

#[test]
fn cerrar_un_mes_ya_cerrado_falla_con_error_nombrado() {
    let mut repo: MemoryRepository = repo_con(snapshot_base());
    cerrar_mes(&mut repo, &peticion()).expect("primer cierre");
    let segundo = cerrar_mes(&mut repo, &peticion());
    assert!(matches!(segundo, Err(ErrorCierre::MesYaCerrado(_))));
}

#[test]
fn reabrir_elimina_el_cierre_y_vuelve_editable() {
    let mut repo: MemoryRepository = repo_con(snapshot_base());
    cerrar_mes(&mut repo, &peticion()).expect("cierre");
    let reabierto = reabrir_mes(&mut repo, "2026-07").expect("reapertura");
    assert!(reabierto.assessments.is_empty());
    let vigente = repo.stored.as_ref().expect("estado persistido");
    assert!(!vigente.mes_cerrado("2026-07"));
}

#[test]
fn reabrir_un_mes_no_cerrado_falla_con_error_nombrado() {
    let mut repo: MemoryRepository = repo_con(snapshot_base());
    let resultado = reabrir_mes(&mut repo, "2026-06");
    assert!(matches!(resultado, Err(ErrorCierre::MesNoCerrado(_))));
}
