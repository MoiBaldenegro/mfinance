// Suite F20 (REQ-20-02/03), parte 3: los resúmenes de las secciones
// (PyG Balance Deuda Inversiones Conciliación Ajustes) formatean con la
// moneda del snapshot. Escrito ANTES de migrar (TDD rojo→verde).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resumenDeSeccion } from '../../src/domain/use-cases/resumenes-secciones.ts';
import { snapshotDePrueba } from '../frontend-shell/helpers.mjs';

describe('resúmenes siguen la moneda del snapshot (REQ-20-02/03)', () => {
  const base = snapshotDePrueba();
  const enEuros = {
    ...base,
    strategy: { ...base.strategy, currency: 'EUR' },
  };
  const enPesos = {
    ...enEuros,
    strategy: { ...enEuros.strategy, currency: 'MXN' },
  };

  it('resumen PyG formatea con la moneda del snapshot', () => {
    // Ingresos 3450 − gastos 1874 = 1576.
    assert.ok(resumenDeSeccion('pyg', enEuros).includes('1.576,00 €'));
    assert.ok(resumenDeSeccion('pyg', enPesos).includes('$1,576.00'));
  });

  it('resumen Balance formatea patrimonio con signo y moneda', () => {
    // Activos 4180.50 − pasivos 10700 = −6519.50.
    assert.ok(resumenDeSeccion('balance', enEuros).includes('-6.519,50 €'));
    assert.ok(resumenDeSeccion('balance', enPesos).includes('-$6,519.50'));
  });

  it('resúmenes Deuda e Inversiones siguen la moneda', () => {
    assert.ok(resumenDeSeccion('deuda', enEuros).includes('10.700,00 €'));
    assert.ok(resumenDeSeccion('inversiones', enEuros).includes('20.200,00 €'));
    assert.ok(resumenDeSeccion('deuda', enPesos).includes('$10,700.00'));
  });

  it('resúmenes Conciliación y Ajustes siguen la moneda', () => {
    assert.ok(resumenDeSeccion('conciliacion', enEuros).includes('499,00 €'));
    assert.ok(resumenDeSeccion('ajustes', enEuros).includes('120,00 €'));
    assert.ok(resumenDeSeccion('ajustes', enPesos).includes('$120.00'));
  });
});
