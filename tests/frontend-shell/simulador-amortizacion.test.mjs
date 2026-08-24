// Suite F15 (3/3): filas de la tabla de amortización formateadas mes a
// mes (REQ-15-06) desde el caso de uso puro del simulador.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filasTablaAmortizacion } from '../../src/domain/use-cases/simulador-comparativa.ts';
import { RESULTADO_AMORTIZACION } from './fixtures-simulador.mjs';

describe('filas de la tabla de amortización (REQ-15-06)', () => {
  it('convierte cada fila a texto es-ES en euros manteniendo el mes', () => {
    const filas = filasTablaAmortizacion(RESULTADO_AMORTIZACION, 'EUR');
    assert.equal(filas.length, 2);
    assert.equal(filas[0].mes, 1);
    assert.equal(filas[0].interes, '100,00 €');
    assert.equal(filas[0].capital, '788,49 €');
    assert.equal(filas[0].saldoRestante, '9.211,51 €');
    assert.equal(filas[1].totalAcumulado, '1.776,98 €');
  });

  it('devuelve lista vacía para un resultado sin filas', () => {
    assert.deepEqual(
      filasTablaAmortizacion({ ...RESULTADO_AMORTIZACION, tabla: [] }),
      [],
    );
  });
});
