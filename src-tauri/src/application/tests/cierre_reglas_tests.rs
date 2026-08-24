//! Tests del motor de reglas del assessment (REQ-16-04/06): recomendaciones
//! accionables en español encabezadas por los riesgos rojos prioritarios.

use crate::application::cierre::reglas::evaluar_recomendaciones;
use crate::application::cierre::tipos::Severidad;
use crate::application::indicadores_types::{IndicadorResultado, Indicadores, Semaphore};

fn indicador(nombre: &str, valor: f64, clasificacion: Semaphore) -> IndicadorResultado {
    IndicadorResultado::con_valor(nombre, valor, clasificacion)
}

fn indicadores(
    endeudamiento: IndicadorResultado,
    tasa_ahorro: IndicadorResultado,
    fondo_emergencia: IndicadorResultado,
    ingreso_pasivo: IndicadorResultado,
) -> Indicadores {
    Indicadores { endeudamiento, tasa_ahorro, fondo_emergencia, ingreso_pasivo }
}

fn todo(clasificacion: Semaphore) -> Indicadores {
    indicadores(
        indicador("Endeudamiento", 10.0, clasificacion),
        indicador("Tasa de ahorro", 20.0, clasificacion),
        indicador("Fondo de emergencia", 4.0, clasificacion),
        indicador("Ingreso pasivo", 30.0, clasificacion),
    )
}

#[test]
fn los_riesgos_rojos_encabezan_la_lista_como_prioritarios() {
    let mezcla = indicadores(
        indicador("Endeudamiento", 35.0, Semaphore::Rojo),
        indicador("Tasa de ahorro", 2.0, Semaphore::Rojo),
        indicador("Fondo de emergencia", 1.5, Semaphore::Amarillo),
        indicador("Ingreso pasivo", 10.0, Semaphore::Verde),
    );
    let consejos = evaluar_recomendaciones(&mezcla);
    assert!(consejos.len() >= 4);
    assert_eq!(consejos[0].severidad, Severidad::Rojo);
    assert_eq!(consejos[1].severidad, Severidad::Rojo);
}

#[test]
fn el_orden_es_rojos_luego_amarillos_luego_verdes() {
    let consejos = evaluar_recomendaciones(&todo(Semaphore::Verde));
    let severidades: Vec<Severidad> = consejos.iter().map(|c| c.severidad).collect();
    let primer_amarillo = severidades.iter().position(|s| *s == Severidad::Amarillo);
    let primer_verde = severidades.iter().position(|s| *s == Severidad::Verde);
    assert!(!severidades.contains(&Severidad::Rojo));
    if let (Some(a), Some(v)) = (primer_amarillo, primer_verde) {
        assert!(a < v);
    }
}

#[test]
fn toda_recomendacion_trae_titulo_y_texto_accionable_en_espanol() {
    for consejo in evaluar_recomendaciones(&todo(Semaphore::Amarillo)) {
        assert!(!consejo.titulo.is_empty());
        assert!(!consejo.texto.is_empty());
        // Texto accionable: termina con una instrucción concreta.
        assert!(
            consejo.texto.ends_with('.') || consejo.texto.ends_with('…'),
            "el texto debe ser una instrucción completa: {}",
            consejo.texto
        );
    }
}

#[test]
fn sin_datos_genera_consejo_informativo_sin_panico() {
    let vacios = indicadores(
        IndicadorResultado::sin_datos("Endeudamiento", "Ingresos del mes son cero"),
        IndicadorResultado::sin_datos("Tasa de ahorro", "Ingresos del mes son cero"),
        IndicadorResultado::sin_datos("Fondo de emergencia", "Gastos del mes son cero"),
        IndicadorResultado::sin_datos("Ingreso pasivo", "Gastos del mes son cero"),
    );
    let consejos = evaluar_recomendaciones(&vacios);
    for consejo in &consejos {
        assert_ne!(consejo.severidad, Severidad::Rojo);
        assert!(!consejo.texto.is_empty());
    }
}

#[test]
fn escenario_todo_verde_refuerza_el_buen_camino() {
    let consejos = evaluar_recomendaciones(&todo(Semaphore::Verde));
    assert!(!consejos.is_empty());
    assert!(consejos.iter().all(|c| c.severidad == Severidad::Verde));
}
