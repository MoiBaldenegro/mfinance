// Tests de lógica pura cargarIndicadores - estructura de indicadores

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

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

/**
 * @typedef {Object} Indicadores
 * @property {IndicadorResultado} endeudamiento
 * @property {IndicadorResultado} tasa_ahorro
 * @property {IndicadorResultado} fondo_emergencia
 * @property {IndicadorResultado} ingreso_pasivo
 */

// Mock del puerto SnapshotPort
/**
 * @param {Indicadores} indicadores
 * @returns {Object}
 */
function crearPuertoMock(indicadores) {
  return {
    indicadores: async () => indicadores,
    load: async () => ({}),
    save: async () => {},
    export: async (destination) => destination,
    import: async (origin) => ({}),
    pygSerie: async () => ({}),
    balanceSerie: async () => ({}),
    planDeuda: async () => ({}),
    assetUpsert: async () => ({}),
    assetEliminar: async () => ({}),
    liabilityUpsert: async () => ({}),
    liabilityEliminar: async () => ({}),
  };
}

// Indicadores de prueba con valores típicos
/**
 * @returns {Indicadores}
 */
function indicadoresCompletos() {
  return {
    endeudamiento: { nombre: 'Endeudamiento', valor: 20.0, clasificacion: 'amarillo', sin_datos: false, explicacion: null },
    tasa_ahorro: { nombre: 'Tasa de ahorro', valor: 15.0, clasificacion: 'amarillo', sin_datos: false, explicacion: null },
    fondo_emergencia: { nombre: 'Fondo de emergencia', valor: 2.5, clasificacion: 'amarillo', sin_datos: false, explicacion: null },
    ingreso_pasivo: { nombre: 'Ingreso pasivo', valor: 30.0, clasificacion: 'amarillo', sin_datos: false, explicacion: null },
  };
}

describe('Lógica pura cargarIndicadores - estructura de indicadores', () => {
  it('cada indicador tiene nombre, valor, clasificación y campos sin_datos/explicacion', async () => {
    const { cargarIndicadores } = await import('../../src/domain/use-cases/indicadores-logic.ts');
    
    const puerto = crearPuertoMock(indicadoresCompletos());
    const resultado = await cargarIndicadores(puerto);
    
    for (const [, ind] of Object.entries(resultado)) {
      assert.ok(typeof ind.nombre === 'string' && ind.nombre.length > 0);
      assert.ok(typeof ind.valor === 'number');
      assert.ok(['verde', 'amarillo', 'rojo'].includes(ind.clasificacion));
      assert.ok(typeof ind.sin_datos === 'boolean');
      assert.ok(ind.explicacion === null || typeof ind.explicacion === 'string');
    }
  });
});