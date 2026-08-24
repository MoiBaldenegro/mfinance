// Tests de lógica pura: clasificación semáforo - Endeudamiento (REQ-10-02)

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { crearIndicador } from './indicadores-helpers.mjs';

describe('Indicadores - clasificación semáforo: Endeudamiento (REQ-10-02)', () => {
  it('verde cuando < 15%', () => {
    const ind = crearIndicador('Endeudamiento', 10.0, 'verde');
    assert.equal(ind.clasificacion, 'verde');
    assert.equal(ind.valor, 10.0);
  });

  it('amarillo cuando 15-30% (incluyente)', () => {
    const ind15 = crearIndicador('Endeudamiento', 15.0, 'amarillo');
    const ind20 = crearIndicador('Endeudamiento', 20.0, 'amarillo');
    const ind30 = crearIndicador('Endeudamiento', 30.0, 'amarillo');
    assert.equal(ind15.clasificacion, 'amarillo');
    assert.equal(ind20.clasificacion, 'amarillo');
    assert.equal(ind30.clasificacion, 'amarillo');
  });

  it('rojo cuando > 30%', () => {
    const ind = crearIndicador('Endeudamiento', 35.0, 'rojo');
    assert.equal(ind.clasificacion, 'rojo');
    assert.equal(ind.valor, 35.0);
  });

  it('sin datos cuando ingresos = 0', () => {
    const ind = crearIndicador('Endeudamiento', 0.0, 'rojo', true, 'Ingresos del mes son cero');
    assert.equal(ind.sin_datos, true);
    assert.equal(ind.explicacion, 'Ingresos del mes son cero');
  });
});