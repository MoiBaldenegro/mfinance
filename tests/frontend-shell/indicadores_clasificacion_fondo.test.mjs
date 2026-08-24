// Tests de lógica pura: clasificación semáforo - Fondo de emergencia (REQ-10-04)

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { crearIndicador } from './indicadores-helpers.mjs';

describe('Indicadores - clasificación semáforo: Fondo de emergencia (REQ-10-04)', () => {
  it('verde cuando >= 3 meses', () => {
    const ind = crearIndicador('Fondo de emergencia', 3.33, 'verde');
    assert.equal(ind.clasificacion, 'verde');
    assert.ok(ind.valor >= 3.0);
  });

  it('amarillo cuando 1-<3 meses (incluyente en 1)', () => {
    const ind1 = crearIndicador('Fondo de emergencia', 1.0, 'amarillo');
    const ind2 = crearIndicador('Fondo de emergencia', 2.0, 'amarillo');
    assert.equal(ind1.clasificacion, 'amarillo');
    assert.equal(ind2.clasificacion, 'amarillo');
  });

  it('rojo cuando < 1 mes', () => {
    const ind = crearIndicador('Fondo de emergencia', 0.67, 'rojo');
    assert.equal(ind.clasificacion, 'rojo');
  });

  it('sin datos cuando gastos = 0', () => {
    const ind = crearIndicador('Fondo de emergencia', 0.0, 'rojo', true, 'Gastos del mes son cero');
    assert.equal(ind.sin_datos, true);
    assert.equal(ind.explicacion, 'Gastos del mes son cero');
  });
});