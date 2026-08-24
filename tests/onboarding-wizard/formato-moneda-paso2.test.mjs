// Suite F25: tests de formateo monetario con núcleo multi-moneda (REQ-25-08)
// Tests de regresión para formatoMoneda
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatoMoneda } from '../../src/domain/use-cases/formato-moneda.ts';

describe('F25 — Formateo con núcleo multi-moneda (REQ-25-08)', () => {
  it('formatea en MXN con $ antes y separadores US', () => {
    assert.equal(formatoMoneda(1576000.5, 'MXN', 2), '$1,576,000.50');
  });

  it('formatea en USD con $ antes y separadores US', () => {
    assert.equal(formatoMoneda(1576000.5, 'USD', 2), '$1,576,000.50');
  });

  it('formatea en EUR con € después y separadores EU', () => {
    assert.equal(formatoMoneda(1576000.5, 'EUR', 2), '1.576.000,50 €');
  });

  it('formatea negativos con signo inicial', () => {
    assert.equal(formatoMoneda(-1000, 'MXN', 2), '-$1,000.00');
    assert.equal(formatoMoneda(-1000, 'EUR', 2), '-1.000,00 €');
  });

  it('variante sin decimales para inversiones', () => {
    assert.equal(formatoMoneda(1576000.5, 'MXN', 0), '$1,576,001');
    assert.equal(formatoMoneda(1576000.5, 'EUR', 0), '1.576.001 €');
  });
});