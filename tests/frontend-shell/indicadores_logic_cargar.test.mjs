// Tests de lógica pura cargarIndicadores - carga exitosa

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

describe('Lógica pura cargarIndicadores - carga exitosa', () => {
  it('obtiene los 4 indicadores del backend vía puerto', async () => {
    const { cargarIndicadores } = await import('../../src/domain/use-cases/indicadores-logic.ts');
    
    const puerto = crearPuertoMock(indicadoresCompletos());
    const resultado = await cargarIndicadores(puerto);
    
    assert.ok(resultado.endeudamiento);
    assert.ok(resultado.tasa_ahorro);
    assert.ok(resultado.fondo_emergencia);
    assert.ok(resultado.ingreso_pasivo);
    assert.equal(resultado.endeudamiento.clasificacion, 'amarillo');
    assert.equal(resultado.tasa_ahorro.clasificacion, 'amarillo');
    assert.equal(resultado.fondo_emergencia.clasificacion, 'amarillo');
    assert.equal(resultado.ingreso_pasivo.clasificacion, 'amarillo');
  });
});