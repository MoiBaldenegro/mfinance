// Tests de lógica pura: clasificación semáforo - Tasa de ahorro (REQ-10-03)

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { crearIndicador } from './indicadores-helpers.mjs';

describe('Indicadores - clasificación semáforo: Tasa de ahorro (REQ-10-03)', () => {
  it('verde cuando > 15%', () => {
    const ind = crearIndicador('Tasa de ahorro', 20.0, 'verde');
    assert.equal(ind.clasificacion, 'verde');
  });

  it('amarillo cuando 5-15% (incluyente)', () => {
    const ind5 = crearIndicador('Tasa de ahorro', 5.0, 'amarillo');
    const ind10 = crearIndicador('Tasa de ahorro', 10.0, 'amarillo');
    const ind15 = crearIndicador('Tasa de ahorro', 15.0, 'amarillo');
    assert.equal(ind5.clasificacion, 'amarillo');
    assert.equal(ind10.clasificacion, 'amarillo');
    assert.equal(ind15.clasificacion, 'amarillo');
  });

  it('rojo cuando < 5%', () => {
    const ind = crearIndicador('Tasa de ahorro', 4.0, 'rojo');
    assert.equal(ind.clasificacion, 'rojo');
  });

  it('sin datos cuando ingresos = 0', () => {
    const ind = crearIndicador('Tasa de ahorro', 0.0, 'rojo', true, 'Ingresos del mes son cero');
    assert.equal(ind.sin_datos, true);
    assert.equal(ind.explicacion, 'Ingresos del mes son cero');
  });
});