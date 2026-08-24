//! Tipos compartidos de los indicadores semáforo.

use serde::Serialize;

/// Clasificación del semáforo.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Semaphore {
    Verde,
    Amarillo,
    Rojo,
}

/// Resultado de un indicador individual.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct IndicadorResultado {
    /// Nombre del indicador.
    pub nombre: String,
    /// Valor calculado (porcentaje o meses).
    pub valor: f64,
    /// Clasificación semáforo.
    pub clasificacion: Semaphore,
    /// Si falta dato necesario (ingresos=0, gastos=0, etc.).
    pub sin_datos: bool,
    /// Explicación breve en español cuando sin_datos=true.
    pub explicacion: Option<String>,
}

impl IndicadorResultado {
    /// Crea un resultado con valor calculado y clasificación.
    pub fn con_valor(nombre: &str, valor: f64, clasificacion: Semaphore) -> Self {
        Self {
            nombre: nombre.into(),
            valor,
            clasificacion,
            sin_datos: false,
            explicacion: None,
        }
    }

    /// Crea un resultado indicando que faltan datos.
    pub fn sin_datos(nombre: &str, explicacion: &str) -> Self {
        Self {
            nombre: nombre.into(),
            valor: 0.0,
            clasificacion: Semaphore::Rojo, // valor por defecto, no se usa cuando sin_datos=true
            sin_datos: true,
            explicacion: Some(explicacion.into()),
        }
    }
}

/// Conjunto de los cuatro indicadores del semáforo.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Indicadores {
    /// Endeudamiento: cuotas_deuda / ingresos * 100.
    pub endeudamiento: IndicadorResultado,
    /// Tasa de ahorro: (ingresos - gastos) / ingresos * 100.
    pub tasa_ahorro: IndicadorResultado,
    /// Fondo de emergencia: activos líquidos / gastos_mensuales.
    pub fondo_emergencia: IndicadorResultado,
    /// Ingreso pasivo: rendimientos_inversiones / gastos_mensuales * 100.
    pub ingreso_pasivo: IndicadorResultado,
}