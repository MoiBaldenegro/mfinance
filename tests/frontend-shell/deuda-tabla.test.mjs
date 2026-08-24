// Suite F9: tabla de proyección de deuda (REQ-09-03) con cifras en
// formato es-ES euros y estado vacío en español (REQ-09-07).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  filasDeTablaProyeccion,
  metricasDePlan,
  proyeccionVacia,
  MENSAJE_SIN_DEUDAS,
} from '../../src/domain/use-cases/deuda-tabla.ts';

const PROYECCION = {
  filas: [
    { mes: 1, saldo_total_restante: 5960, pago_total_mes: 140, intereses_mes: 50, principal_mes: 90 },
    { mes: 2, saldo_total_restante: 5870, pago_total_mes: 140, intereses_mes: 49, principal_mes: 91 },
    { mes: 3, saldo_total_restante: 0, pago_total_mes: 5870, intereses_mes: 10, principal_mes: 5860 },
  ],
  meses_hasta_libre: 3,
  intereses_totales: 109,
  total_pagado: 6109,
  intereses_ahorrados: 45,
};

describe('tabla proyección deuda (REQ-09-03)', () => {
  it('transforma cada fila en formato es-ES euros', () => {
    const filas = filasDeTablaProyeccion(PROYECCION, 'EUR');
    assert.deepEqual(filas[0], {
      mes: '1',
      saldoRestante: '5.960,00 €',
      pagoTotal: '140,00 €',
      intereses: '50,00 €',
      principal: '90,00 €',
    });
  });

  it('conserva el orden y llega a saldo 0', () => {
    const filas = filasDeTablaProyeccion(PROYECCION, 'EUR');
    assert.equal(filas.length, 3);
    assert.equal(filas[2].saldoRestante, '0,00 €');
  });

  it('métricas formateadas en es-ES', () => {
    const metricas = metricasDePlan(PROYECCION, 'EUR');
    assert.equal(metricas.mesesHastaLibre, '3');
    assert.equal(metricas.interesesTotales, '109,00 €');
    assert.equal(metricas.interesesAhorrados, '45,00 €');
    assert.equal(metricas.totalPagado, '6.109,00 €');
  });

  it('proyección sin filas se detecta vacía con mensaje en español', () => {
    assert.equal(proyeccionVacia({ filas: [], meses_hasta_libre: 0, intereses_totales: 0, total_pagado: 0, intereses_ahorrados: 0 }), true);
    assert.equal(proyeccionVacia(PROYECCION), false);
    assert.ok(MENSAJE_SIN_DEUDAS.includes('libre de deuda'));
    assert.ok(MENSAJE_SIN_DEUDAS.length > 20);
  });
});