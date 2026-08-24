// Suite F15 (2/3): caso de uso puro que deriva la vista comparativa
// base vs optimizado (REQ-15-04) a partir de la respuesta del backend.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { comparativaDesdeSimulacion } from '../../src/domain/use-cases/simulador-comparativa.ts';
import { SIMULACION } from './fixtures-simulador.mjs';

describe('comparativa base vs optimizado (REQ-15-04)', () => {
  it('deriva meses ahorrados e intereses ahorrados en euros', () => {
    const vista = comparativaDesdeSimulacion(SIMULACION, 'EUR');
    assert.equal(vista.mesesAhorrados, 2);
    assert.equal(vista.interesesAhorrados, '118,74 €');
    assert.equal(vista.hayAhorro, true);
  });

  it('expone las métricas de cada escenario formateadas en euros', () => {
    const vista = comparativaDesdeSimulacion(SIMULACION, 'EUR');
    assert.equal(vista.base.cuota, '888,49 €');
    assert.equal(vista.base.meses, 12);
    assert.equal(vista.base.intereses, '661,85 €');
    assert.equal(vista.base.totalPagado, '10.661,85 €');
    assert.equal(vista.optimizado.cuota, '1.088,49 €');
    assert.equal(vista.optimizado.meses, 10);
    assert.equal(vista.optimizado.intereses, '543,11 €');
  });

  it('marca hayAhorro=false cuando no hay optimización', () => {
    const plana = {
      ...SIMULACION,
      optimizado: { ...SIMULACION.base },
      meses_ahorrados: 0,
      intereses_ahorrados: 0,
    };
    const vista = comparativaDesdeSimulacion(plana, 'EUR');
    assert.equal(vista.hayAhorro, false);
    assert.equal(vista.mesesAhorrados, 0);
  });
});
