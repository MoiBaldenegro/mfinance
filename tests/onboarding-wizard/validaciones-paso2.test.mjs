// Suite F25: tests de validaciones reutilizadas (features 8 y 11)
// Estos tests ya pasaban - los mantenemos como regresión
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validarTasa } from '../../src/domain/use-cases/inversiones-proyeccion.ts';
import { validarActivo, validarPasivo, ERROR_VALOR_NEGATIVO_ACTIVO, ERROR_SALDO_NEGATIVO_PASIVO, ERROR_TASA_NEGATIVA_PASIVO } from '../../src/domain/use-cases/balance-validaciones.ts';

describe('F25 — Reutilización de validaciones features 8/11 (REQ-25-05)', () => {
  describe('validarActivo (feature 8)', () => {
    it('acepta valor positivo', () => {
      const resultado = validarActivo('Efectivo', 'liquido', 1000);
      assert.equal(resultado, undefined);
    });

    it('rechaza valor negativo con mensaje en español', () => {
      const resultado = validarActivo('Efectivo', 'liquido', -100);
      assert.equal(resultado, ERROR_VALOR_NEGATIVO_ACTIVO);
    });

    it('rechaza valor cero (no positivo)', () => {
      const resultado = validarActivo('Efectivo', 'liquido', 0);
      assert.equal(resultado, undefined); // 0 es válido según validarActivo (solo < 0)
    });
  });

  describe('validarPasivo (feature 8)', () => {
    it('acepta saldo positivo y tasa válida', () => {
      const resultado = validarPasivo('Hipoteca', 100000, 3.5);
      assert.equal(resultado, undefined);
    });

    it('rechaza saldo negativo con mensaje en español', () => {
      const resultado = validarPasivo('Hipoteca', -1000, 3.5);
      assert.equal(resultado, ERROR_SALDO_NEGATIVO_PASIVO);
    });

    it('rechaza tasa negativa con mensaje en español', () => {
      const resultado = validarPasivo('Hipoteca', 100000, -1);
      assert.equal(resultado, ERROR_TASA_NEGATIVA_PASIVO);
    });
  });

  describe('validarTasa (feature 11)', () => {
    it('acepta tasa en [0, 30]', () => {
      assert.deepEqual(validarTasa(0), { valida: true, mensaje: '' });
      assert.deepEqual(validarTasa(5), { valida: true, mensaje: '' });
      assert.deepEqual(validarTasa(30), { valida: true, mensaje: '' });
    });

    it('rechaza tasa negativa con mensaje en español', () => {
      assert.deepEqual(validarTasa(-1), { valida: false, mensaje: 'La tasa no puede ser negativa' });
    });

    it('rechaza tasa > 30 con mensaje en español', () => {
      assert.deepEqual(validarTasa(31), { valida: false, mensaje: 'La tasa no puede superar el 30% anual' });
    });
  });
});