// Suite F7: datasets de la gráfica Chart.js (REQ-07-03) construidos de
// forma pura desde la serie: barras ingresos/gastos + línea de ahorro.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  datosDeGrafica,
} from '../../src/domain/use-cases/pyg-grafica.ts';

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

const COLORES = {
  ingresos: '#1f5c45',
  gastos: '#c0392b',
  ahorro: '#b58a00',
};

describe('datasets de Chart.js desde la serie (REQ-07-03)', () => {
  const datos = datosDeGrafica(SERIE, COLORES);

  it('construye las etiquetas con los meses en orden de la serie', () => {
    assert.deepEqual(datos.etiquetas, ['2026-01', '2026-02']);
  });

  it('devuelve tres series: dos barras y una línea superpuesta', () => {
    assert.deepEqual(
      datos.series.map((s) => [s.nombre, s.tipo]),
      [
        ['Ingresos', 'barra'],
        ['Gastos', 'barra'],
        ['Ahorro acumulado', 'linea'],
      ],
    );
  });

  it('barras ingresos contra gastos con los colores inyectados', () => {
    const [ingresos, gastos] = datos.series;
    assert.deepEqual(ingresos.valores, [3450, 1000]);
    assert.equal(ingresos.color, COLORES.ingresos);
    assert.deepEqual(gastos.valores, [1874, 1250]);
    assert.equal(gastos.color, COLORES.gastos);
  });

  it('línea del ahorro acumulado alineada con la suma corrida', () => {
    const linea = datos.series[2];
    assert.deepEqual(linea.valores, [1576, 1326]);
    assert.equal(linea.color, COLORES.ahorro);
  });
});
