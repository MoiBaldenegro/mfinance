// Suite F7: tabla P&G mes a mes desde la serie del backend (REQ-07-02),
// con cifras en formato europeo y estado vacío en español (REQ-07-06).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  filasDeTabla,
  MENSAJE_SIN_REGISTROS,
  serieVacia,
} from '../../src/domain/use-cases/pyg-tabla.ts';

const SERIE = {
  filas: [
    {
      mes: '2026-01',
      ingresos: 3450,
      gastos: 1874,
      utilidad: 1576,
      ahorro_acumulado: 1576,
    },
    {
      mes: '2026-02',
      ingresos: 1000,
      gastos: 1250,
      utilidad: -250,
      ahorro_acumulado: 1326,
    },
  ],
};

describe('tabla PyG desde la serie del backend (REQ-07-02)', () => {
  it('transforma cada fila de la serie en fila formateada es-ES euros', () => {
    assert.deepEqual(filasDeTabla(SERIE, 'EUR')[0], {
      mes: '2026-01',
      ingresos: '3.450,00 €',
      gastos: '1.874,00 €',
      utilidad: '1.576,00 €',
      ahorroAcumulado: '1.576,00 €',
    });
  });

  it('conserva el orden recibido y el signo negativo de la utilidad', () => {
    const filas = filasDeTabla(SERIE, 'EUR');
    assert.equal(filas.length, 2);
    assert.equal(filas[1].mes, '2026-02');
    assert.equal(filas[1].utilidad, '-250,00 €');
    assert.equal(filas[1].ahorroAcumulado, '1.326,00 €');
  });

  it('serie sin filas se detecta vacía con mensaje invitando a Registro', () => {
    assert.equal(serieVacia({ filas: [] }), true);
    assert.equal(serieVacia(SERIE), false);
    assert.ok(MENSAJE_SIN_REGISTROS.includes('Registro'));
    assert.ok(MENSAJE_SIN_REGISTROS.length > 20);
  });
});
