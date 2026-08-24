// Tests de lógica pura cargarIndicadores - estado sin datos

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

// Indicadores sin datos
/**
 * @returns {Indicadores}
 */
function indicadoresSinDatos() {
  return {
    endeudamiento: { nombre: 'Endeudamiento', valor: 0.0, clasificacion: 'rojo', sin_datos: true, explicacion: 'Ingresos del mes son cero' },
    tasa_ahorro: { nombre: 'Tasa de ahorro', valor: 0.0, clasificacion: 'rojo', sin_datos: true, explicacion: 'Ingresos del mes son cero' },
    fondo_emergencia: { nombre: 'Fondo de emergencia', valor: 0.0, clasificacion: 'rojo', sin_datos: true, explicacion: 'Gastos del mes son cero' },
    ingreso_pasivo: { nombre: 'Ingreso pasivo', valor: 0.0, clasificacion: 'rojo', sin_datos: true, explicacion: 'Gastos del mes son cero' },
  };
}

describe('Lógica pura cargarIndicadores - estado sin datos', () => {
  it('maneja estado sin datos cuando ingresos/gastos = 0', async () => {
    const { cargarIndicadores } = await import('../../src/domain/use-cases/indicadores-logic.ts');
    
    const puerto = crearPuertoMock(indicadoresSinDatos());
    const resultado = await cargarIndicadores(puerto);
    
    assert.equal(resultado.endeudamiento.sin_datos, true);
    assert.equal(resultado.tasa_ahorro.sin_datos, true);
    assert.equal(resultado.fondo_emergencia.sin_datos, true);
    assert.equal(resultado.ingreso_pasivo.sin_datos, true);
    assert.equal(resultado.endeudamiento.explicacion, 'Ingresos del mes son cero');
    assert.equal(resultado.fondo_emergencia.explicacion, 'Gastos del mes son cero');
  });
});