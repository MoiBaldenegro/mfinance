// Suite F20 (REQ-20-03), parte 2: Deuda Simulador Conciliación e
// Inversiones producen cadenas según la MONEDA RECIBIDA (MXN y EUR).
// Escrito ANTES de migrar el código (TDD rojo→verde).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  filasDeTablaProyeccion,
  metricasDePlan,
} from '../../src/domain/use-cases/deuda-tabla.ts';
import { formatearImporte } from '../../src/domain/use-cases/conciliacion-logic.ts';
import { formatearProyeccion } from '../../src/domain/use-cases/inversiones-proyeccion.ts';
import {
  comparativaDesdeSimulacion,
  filasTablaAmortizacion,
} from '../../src/domain/use-cases/simulador-comparativa.ts';

const PROYECCION_DEUDA = {
  filas: [
    {
      mes: 1,
      saldo_total_restante: 5960,
      pago_total_mes: 140,
      intereses_mes: 50,
      principal_mes: 90,
    },
  ],
  meses_hasta_libre: 47,
  intereses_totales: 109,
  intereses_ahorrados: 45,
  total_pagado: 6109,
};

const SIMULACION = {
  base: {
    cuota_mensual: 888.49,
    meses: 12,
    intereses_totales: 661.85,
    total_pagado: 10661.85,
    tabla: [
      {
        mes: 1,
        cuota: 888.49,
        interes: 100,
        capital: 788.49,
        saldo_restante: 9211.51,
        total_acumulado: 888.49,
      },
    ],
  },
  optimizado: {
    cuota_mensual: 1088.49,
    meses: 9,
    intereses_totales: 543.11,
    total_pagado: 10543.11,
    tabla: [],
  },
  meses_ahorrados: 3,
  intereses_ahorrados: 118.74,
};

describe('Deuda y Simulador migrados reciben la moneda (REQ-20-03)', () => {
  it('plan de deuda formatea filas y métricas según la moneda', () => {
    assert.equal(filasDeTablaProyeccion(PROYECCION_DEUDA, 'MXN')[0]
      .saldoRestante, '$5,960.00');
    assert.equal(metricasDePlan(PROYECCION_DEUDA, 'EUR').totalPagado,
      '6.109,00 €');
    assert.equal(metricasDePlan(PROYECCION_DEUDA, 'MXN').interesesAhorrados,
      '$45.00');
  });

  it('simulador formatea comparativa y amortización según la moneda', () => {
    const mxn = comparativaDesdeSimulacion(SIMULACION, 'MXN');
    const eur = comparativaDesdeSimulacion(SIMULACION, 'EUR');
    assert.equal(mxn.base.cuota, '$888.49');
    assert.equal(eur.interesesAhorrados, '118,74 €');
    assert.deepEqual(eur.base.meses, 12);
    const [filaMxn] = filasTablaAmortizacion(SIMULACION.base, 'MXN');
    const [filaEur] = filasTablaAmortizacion(SIMULACION.base, 'EUR');
    assert.equal(filaMxn.interes, '$100.00');
    assert.equal(filaEur.capital, '788,49 €');
  });
});

describe('Conciliación e Inversiones migradas reciben la moneda (REQ-20-03)', () => {
  it('conciliación formatea importes según la moneda', () => {
    assert.equal(formatearImporte(1234.5, 'MXN'), '$1,234.50');
    assert.equal(formatearImporte(1234.5, 'EUR'), '1.234,50 €');
    assert.equal(formatearImporte(-250, 'MXN'), '-$250.00');
  });

  it('inversiones formatea sin decimales según la moneda', () => {
    assert.equal(formatearProyeccion(1234.56, 'MXN'), '$1,235');
    assert.equal(formatearProyeccion(1234.49, 'EUR'), '1.234 €');
    assert.equal(formatearProyeccion(20465.5, 'MXN'), '$20,466');
  });
});
