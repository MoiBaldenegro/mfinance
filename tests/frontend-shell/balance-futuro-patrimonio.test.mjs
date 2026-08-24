// Suite F14 (2/2): coherencia del balance futuro proyectado sobre el
// fixture: patrimonio creciente y pasivos decrecientes (REQ-14-02).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filasDeTablaBalanceFuturo } from '../../src/domain/use-cases/balance-futuro.ts';
import { BALANCE_FUTURO } from './fixtures-proyeccion.mjs';

/** Desformatea "12.345,67 €" al número 12345.67. */
function numero(cifra) {
  return parseFloat(cifra.replace(/[.\s€]/g, '').replace(',', '.'));
}

describe('coherencia del balance futuro proyectado (REQ-14-02)', () => {
  it('patrimonio crece mes a mes en la proyección', () => {
    const filas = filasDeTablaBalanceFuturo(BALANCE_FUTURO, 'EUR');
    const patrimonios = filas.slice(3).map((f) => numero(f.patrimonio));
    for (let i = 1; i < patrimonios.length; i++) {
      assert.ok(
        patrimonios[i] > patrimonios[i - 1],
        `Patrimonio debería crecer: mes ${i}`,
      );
    }
  });

  it('pasivos decrecen mes a mes por la amortización', () => {
    const filas = filasDeTablaBalanceFuturo(BALANCE_FUTURO, 'EUR');
    const pasivos = filas.slice(3).map((f) => numero(f.pasivos));
    for (let i = 1; i < pasivos.length; i++) {
      assert.ok(
        pasivos[i] < pasivos[i - 1],
        `Pasivos deberían decrecer: mes ${i}`,
      );
    }
  });
});
