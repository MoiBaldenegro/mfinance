// Suite F19 (1/2): núcleo de formateo determinista multi-moneda
// (REQ-19-04/05), manual y puro sin motores nativos de formateo
// regional, con casos exactos de la spec.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatoMoneda } from '../../src/domain/use-cases/formato-moneda.ts';
import { MonedaFueraCatalogoError } from '../../src/domain/errors/moneda-errors.ts';

describe('REQ-19-04: formatoMoneda determinista sin motores nativos', () => {
  it('1576000.5 produce $1,576,000.50 en MXN y USD', () => {
    assert.equal(formatoMoneda(1576000.5, 'MXN'), '$1,576,000.50');
    assert.equal(formatoMoneda(1576000.5, 'USD'), '$1,576,000.50');
  });

  it('1576000.5 produce 1.576.000,50 € en EUR (símbolo después)', () => {
    assert.equal(formatoMoneda(1576000.5, 'EUR'), '1.576.000,50 €');
  });

  it('negativos con signo inicial: -$… y -1.… €', () => {
    assert.equal(formatoMoneda(-1576, 'MXN'), '-$1,576.00');
    assert.equal(formatoMoneda(-1576, 'USD'), '-$1,576.00');
    assert.equal(formatoMoneda(-1576, 'EUR'), '-1.576,00 €');
  });

  it('variante sin decimales para inversiones (decimales = 0)', () => {
    assert.equal(formatoMoneda(1576000, 'MXN', 0), '$1,576,000');
    assert.equal(formatoMoneda(-980350, 'EUR', 0), '-980.350 €');
    assert.equal(formatoMoneda(25000, 'USD', 0), '$25,000');
  });

  it('cero y valores pequeños quedan legibles', () => {
    assert.equal(formatoMoneda(0, 'MXN'), '$0.00');
    assert.equal(formatoMoneda(42.4, 'EUR'), '42,40 €');
  });

  it('determinista: mismas entradas, misma cadena siempre', () => {
    const primera = formatoMoneda(1234567.891, 'EUR');
    const segunda = formatoMoneda(1234567.891, 'EUR');
    assert.equal(primera, segunda);
    assert.equal(primera, '1.234.567,89 €');
  });
});

describe('REQ-19-05: moneda fuera del catálogo lanza error nombrado', () => {
  it('"GBP" lanza MonedaFueraCatalogoError sin devolver cadena', () => {
    assert.throws(
      // Los datos por IPC pueden traer cualquier string en runtime.
      () => formatoMoneda(100, /** @type {any} */ ('GBP')),
      MonedaFueraCatalogoError,
    );
  });

  it('el error es nombrado y cita la moneda recibida', () => {
    try {
      formatoMoneda(100, /** @type {any} */ ('GBP'));
      assert.fail('debía lanzar');
    } catch (error) {
      assert.ok(error instanceof MonedaFueraCatalogoError);
      assert.equal(error.name, 'MonedaFueraCatalogoError');
      assert.equal(error.codigo, 'GBP');
    }
  });
});
