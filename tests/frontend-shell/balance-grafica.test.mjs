// Suite F8: datasets de la gráfica Chart.js evolución del patrimonio
// (REQ-08-05) construidos de forma pura desde la serie: línea de patrimonio.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  datosDeGraficaBalance,
} from '../../src/domain/use-cases/balance-grafica.ts';

const SERIE = {
  filas: [
    { mes: '2026-01', activos: 10000, pasivos: 5000, patrimonio: 5000 },
    { mes: '2026-02', activos: 11000, pasivos: 5500, patrimonio: 5500 },
    { mes: '2026-03', activos: 11500, pasivos: 5500, patrimonio: 6000 },
  ],
};

const COLORES = {
  patrimonio: '#1f5c45',
};

describe('datasets de Chart.js evolución patrimonio (REQ-08-05)', () => {
  const datos = datosDeGraficaBalance(SERIE, COLORES);

  it('construye las etiquetas con los meses en orden de la serie', () => {
    assert.deepEqual(datos.etiquetas, ['2026-01', '2026-02', '2026-03']);
  });

  it('devuelve una serie de línea para el patrimonio', () => {
    assert.equal(datos.series.length, 1);
    const [patrimonio] = datos.series;
    assert.equal(patrimonio.nombre, 'Patrimonio');
    assert.equal(patrimonio.tipo, 'linea');
  });

  it('valores del patrimonio alineados con la serie', () => {
    const [patrimonio] = datos.series;
    assert.deepEqual(patrimonio.valores, [5000, 5500, 6000]);
    assert.equal(patrimonio.color, COLORES.patrimonio);
  });

  it('serie vacía -> etiquetas vacías y serie con valores vacíos', () => {
    const vacio = datosDeGraficaBalance({ filas: [] }, COLORES);
    assert.deepEqual(vacio.etiquetas, []);
    assert.equal(vacio.series.length, 1);
    assert.equal(vacio.series[0].nombre, 'Patrimonio');
    assert.deepEqual(vacio.series[0].valores, []);
  });
});