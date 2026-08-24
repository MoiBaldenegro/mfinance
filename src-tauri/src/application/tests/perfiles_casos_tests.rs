//! Tests REQ-21-01/06 de los casos de uso de perfiles contra el doble
//! en memoria: validaciones nombradas sin alterar datos y flujo feliz.

use super::memory_perfil_repository::MemoryPerfilRepository;
use crate::application::perfiles::{crear, listar, seleccionar};
use crate::domain::perfil_errors::PerfilError;

#[test]
fn crear_con_nombre_valido_lo_registra_sin_activarlo() {
    let mut repo = MemoryPerfilRepository::default();
    let perfil = crear(&mut repo, " Ana ").expect("alta feliz");
    assert_eq!(perfil.nombre, "Ana", "el nombre se guarda recortado");
    assert!(perfil.id.starts_with("p_"));
    let registro = repo.registro.expect("registro persistido");
    assert_eq!(registro.perfiles.len(), 1);
    assert!(registro.activa.is_none(), "crear no activa por sí solo");
}

#[test]
fn nombre_vacio_o_blanco_rechaza_nombrado_sin_persistir() {
    let mut repo = MemoryPerfilRepository::default();
    for vacio in ["", "   "] {
        let error = crear(&mut repo, vacio).expect_err("debe rechazar");
        assert!(
            matches!(error, PerfilError::NombreVacio),
            "«{vacio}» debe dar NombreVacio"
        );
        assert!(
            repo.guardados.is_empty(),
            "un nombre inválido no altera datos"
        );
    }
}

#[test]
fn nombre_duplicado_rechaza_nombrado_sin_alterar_el_registro() {
    let mut repo = MemoryPerfilRepository::default();
    crear(&mut repo, "Ana").expect("primera alta");
    let antes = repo.registro.clone();
    let error = crear(&mut repo, "Ana").expect_err("duplicado debe fallar");
    match error {
        PerfilError::NombreDuplicado(nombre) => assert_eq!(nombre, "Ana"),
        otro => panic!("error equivocado: {otro:?}"),
    }
    assert_eq!(repo.registro, antes, "el registro queda intacto");
}

#[test]
fn seleccionar_activo_el_perfil_existente() {
    let mut repo = MemoryPerfilRepository::default();
    let ana = crear(&mut repo, "Ana").expect("alta Ana");
    let beto = crear(&mut repo, "Beto").expect("alta Beto");
    assert_ne!(ana.id, beto.id, "ids únicos entre perfiles");
    let activado = seleccionar(&mut repo, &beto.id).expect("activación");
    assert_eq!(activado.id, beto.id);
    let registro = repo.registro.expect("registro vigente");
    assert_eq!(registro.activa.as_deref(), Some(beto.id.as_str()));
}

#[test]
fn seleccionar_id_desconocido_falla_nombrado_sin_alterar() {
    let mut repo = MemoryPerfilRepository::default();
    crear(&mut repo, "Ana").expect("alta Ana");
    let antes = repo.registro.clone();
    let error =
        seleccionar(&mut repo, "p_fantasma").expect_err("debe fallar");
    assert!(matches!(error, PerfilError::PerfilInexistente(_)));
    assert_eq!(repo.registro, antes, "nada cambia ante un id desconocido");
}

#[test]
fn listar_devuelve_vacio_sin_registro_y_los_perfiles_con_el() {
    let mut repo = MemoryPerfilRepository::default();
    assert!(listar(&mut repo).expect("sin registro").is_empty());
    crear(&mut repo, "Ana").expect("alta Ana");
    crear(&mut repo, "Beto").expect("alta Beto");
    let nombres: Vec<String> = listar(&mut repo).expect("listado")
        .into_iter().map(|p| p.nombre).collect();
    assert_eq!(nombres, vec!["Ana".to_string(), "Beto".to_string()]);
}

#[test]
fn registro_corrupto_propaga_error_nombrado_en_todas_las_operaciones() {
    let mut repo = MemoryPerfilRepository::default();
    repo.corrupto = true;
    assert!(matches!(
        listar(&mut repo),
        Err(PerfilError::RegistroCorrupto(_))
    ));
    assert!(matches!(
        crear(&mut repo, "Ana"),
        Err(PerfilError::RegistroCorrupto(_))
    ));
    assert!(matches!(
        seleccionar(&mut repo, "p_x"),
        Err(PerfilError::RegistroCorrupto(_))
    ));
    assert!(repo.guardados.is_empty(), "jamás escribe sobre corrupto");
}
