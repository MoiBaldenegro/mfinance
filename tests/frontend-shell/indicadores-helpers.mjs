// Helpers compartidos para tests de indicadores - no se ejecuta como test (sin patrón *.test.mjs)

/**
 * @typedef {'verde'|'amarillo'|'rojo'} SemaphoreType
 */

/**
 * @typedef {Object} IndicadorResultado
 * @property {string} nombre
 * @property {number} valor
 * @property {SemaphoreType} clasificacion
 * @property {boolean} sin_datos
 * @property {string|null} explicacion
 */

// Helper para crear un resultado de indicador
/**
 * @param {string} nombre
 * @param {number} valor
 * @param {SemaphoreType} clasificacion
 * @param {boolean} [sin_datos=false]
 * @param {string|null} [explicacion=null]
 * @returns {IndicadorResultado}
 */
export function crearIndicador(nombre, valor, clasificacion, sin_datos = false, explicacion = null) {
  return { nombre, valor, clasificacion, sin_datos, explicacion };
}