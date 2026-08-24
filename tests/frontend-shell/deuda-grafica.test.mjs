// Suite F9: datasets de la gráfica Chart.js (REQ-09-05) para plan de deuda:
// barras apiladas principal+intereses + línea saldo restante.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { datosDeGraficaDeuda } from '../../src/domain/use-cases/deuda-grafica.ts';

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

const COLORES = {
  pago: '#1f5c45',
  interes: '#c0392b',
  saldo: '#b58a00',
};

describe('datasets Chart.js plan deuda (REQ-09-05)', () => {
  const datos = datosDeGraficaDeuda(PROYECCION, COLORES);

  it('construye etiquetas con los meses en orden', () => {
    assert.deepEqual(datos.etiquetas, ['1', '2', '3']);
  });

  it('devuelve tres series: dos barras apiladas y una línea', () => {
    assert.deepEqual(
      datos.series.map((s) => [s.nombre, s.tipo]),
      [
        ['Principal', 'barra'],
        ['Intereses', 'barra'],
        ['Saldo restante', 'linea'],
      ],
    );
  });

  it('barras principal e intereses con colores inyectados', () => {
    const [principal, intereses] = datos.series;
    assert.deepEqual(principal.valores, [90, 91, 5860]);
    assert.equal(principal.color, COLORES.pago);
    assert.deepEqual(intereses.valores, [50, 49, 10]);
    assert.equal(intereses.color, COLORES.interes);
  });

  it('línea de saldo restante con color inyectado y eje secundario', () => {
    const saldo = datos.series[2];
    assert.deepEqual(saldo.valores, [5960, 5870, 0]);
    assert.equal(saldo.color, COLORES.saldo);
    assert.equal(saldo.yAxisID, 'y1');
  });

  it('proyección vacía devuelve arrays vacíos', () => {
    const vacio = datosDeGraficaDeuda(
      { filas: [], meses_hasta_libre: 0, intereses_totales: 0, total_pagado: 0, intereses_ahorrados: 0 },
      COLORES,
    );
    assert.deepEqual(vacio.etiquetas, []);
    assert.equal(vacio.series[0].valores.length, 0);
    assert.equal(vacio.series[1].valores.length, 0);
    assert.equal(vacio.series[2].valores.length, 0);
  });
});