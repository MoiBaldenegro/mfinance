//! REQ-16-04/06: motor de reglas del assessment. Evalúa los indicadores
//! del semáforo y produce recomendaciones accionables en español con los
//! riesgos rojos encabezando la lista (prioritarios primero).

use crate::application::cierre::reglas_textos::REGLAS;
use crate::application::cierre::tipos::{Recomendacion, Severidad};
use crate::application::indicadores_types::{IndicadorResultado, Indicadores, Semaphore};

fn rango(severidad: Severidad) -> u8 {
    match severidad {
        Severidad::Rojo => 0,
        Severidad::Amarillo => 1,
        Severidad::Verde => 2,
    }
}

/// Índice de la regla que aplica al indicador; REGLAS.len() si ninguna.
fn indice(indicador: &IndicadorResultado) -> usize {
    REGLAS
        .iter()
        .position(|regla| regla.indicadores.contains(&indicador.nombre.as_str()))
        .unwrap_or(REGLAS.len())
}

fn consejo(indicador: &IndicadorResultado) -> Option<Recomendacion> {
    let regla = REGLAS.get(indice(indicador))?;
    let (severidad, texto) = if indicador.sin_datos {
        (
            Severidad::Verde,
            format!(
                "Falta dato para calcular {}: registra ingresos y gastos completos del mes.",
                indicador.nombre
            ),
        )
    } else {
        let nivel = match indicador.clasificacion {
            Semaphore::Rojo => (Severidad::Rojo, 0),
            Semaphore::Amarillo => (Severidad::Amarillo, 1),
            Semaphore::Verde => (Severidad::Verde, 2),
        };
        (nivel.0, regla.textos[nivel.1].to_string())
    };
    Some(Recomendacion { severidad, titulo: regla.titulo.into(), texto })
}

/// Evalúa las cuatro reglas sobre los indicadores y devuelve los consejos
/// priorizados: rojos primero, luego amarillos, luego verdes.
pub fn evaluar_recomendaciones(indicadores: &Indicadores) -> Vec<Recomendacion> {
    let mut consejos: Vec<Recomendacion> =
        [&indicadores.endeudamiento, &indicadores.tasa_ahorro, &indicadores.fondo_emergencia, &indicadores.ingreso_pasivo]
            .into_iter()
            .filter_map(consejo)
            .collect();
    // Orden estable: dentro de un mismo nivel manda el orden de evaluación.
    consejos.sort_by_key(|consejo| rango(consejo.severidad));
    consejos
}
