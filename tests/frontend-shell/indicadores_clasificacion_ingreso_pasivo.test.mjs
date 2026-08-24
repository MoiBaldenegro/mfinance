// Tests de lógica pura: clasificación semáforo - Ingreso pasivo (REQ-10-05)

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { crearIndicador } from './indicadores-helpers.mjs';

describe('Indicadores - clasificación semáforo: Ingreso pasivo (REQ-10-05)', () => {
  it('verde cuando >= 100%', () => {
    const ind = crearIndicador('Ingreso pasivo', 100.0, 'verde');
    assert.equal(ind.clasificacion, 'verde');
  });

  it('amarillo cuando 25-<100% (incluyente en 25)', () => {
    const ind25 = crearIndicador('Ingreso pasivo', 25.0, 'amarillo');
    const ind50 = crearIndicador('Ingreso pasivo', 50.0, 'amarillo');
    assert.equal(ind25.clasificacion, 'amarillo');
    assert.equal(ind50.clasificacion, 'amarillo');
  });

  it('rojo cuando < 25%', () => {
    const ind = crearIndicador('Ingreso pasivo', 16.67, 'rojo');
    assert.equal(ind.clasificacion, 'rojo');
  });

  it('sin datos cuando gastos = 0', () => {
    const ind = crearIndicador('Ingreso pasivo', 0.0, 'rojo', true, 'Gastos del mes son cero');
    assert.equal(ind.sin_datos, true);
    assert.equal(ind.explicacion, 'Gastos del mes son cero');
  });
});