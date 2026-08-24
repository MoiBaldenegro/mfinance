// Suite F8: validaciones de negativos en activos y pasivos (REQ-08-06)
// rechazan con mensaje en español sin persistir.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  validarActivo,
  validarPasivo,
  ERROR_VALOR_NEGATIVO_ACTIVO,
  ERROR_SALDO_NEGATIVO_PASIVO,
  ERROR_TASA_NEGATIVA_PASIVO,
} from '../../src/domain/use-cases/balance-validaciones.ts';

describe('validaciones negativos Balance (REQ-08-06)', () => {
  it('activo: valor negativo rechaza con mensaje ES', () => {
    const error = validarActivo('Efectivo', 'liquido', -100);
    assert.ok(error);
    assert.equal(error, ERROR_VALOR_NEGATIVO_ACTIVO);
    assert.ok(error.includes('negativo'));
  });

  it('activo: valor cero es válido', () => {
    const error = validarActivo('Cuenta nueva', 'liquido', 0);
    assert.equal(error, undefined);
  });

  it('activo: valor positivo es válido', () => {
    const error = validarActivo('Inversión', 'inversion', 5000);
    assert.equal(error, undefined);
  });

  it('pasivo: saldo negativo rechaza con mensaje ES', () => {
    const error = validarPasivo('Préstamo', -100, 5.0);
    assert.ok(error);
    assert.equal(error, ERROR_SALDO_NEGATIVO_PASIVO);
    assert.ok(error.includes('negativo'));
  });

  it('pasivo: tasa negativa rechaza con mensaje ES', () => {
    const error = validarPasivo('Préstamo', 1000, -1.0);
    assert.ok(error);
    assert.equal(error, ERROR_TASA_NEGATIVA_PASIVO);
    assert.ok(error.includes('negativa'));
  });

  it('pasivo: saldo y tasa cero son válidos', () => {
    const error = validarPasivo('Préstamo', 0, 0);
    assert.equal(error, undefined);
  });

  it('pasivo: saldo y tasa positivos son válidos', () => {
    const error = validarPasivo('Hipoteca', 150000, 3.2);
    assert.equal(error, undefined);
  });
});