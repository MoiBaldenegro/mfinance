// Suite F14 (1/2): tabla y gráfica de la proyección PyG 12 meses con
// distinción histórico/proyectado y estado vacío en español (REQ-14-04/05).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  filasDeTablaProyeccion,
  serieProyeccionVacia,
  MENSAJE_SIN_HISTORICO,
  datosDeGraficaProyeccion,
} from '../../src/domain/use-cases/pyg-proyeccion.ts';
import { COLORES, SERIE_HISTORICA } from './fixtures-proyeccion.mjs';

describe('tabla de proyección PyG (REQ-14-04)', () => {
  it('transforma serie con histórico y proyectado en filas con marca de tipo', () => {
    const filas = filasDeTablaProyeccion(SERIE_HISTORICA, 'EUR');
    assert.equal(filas.length, 15); // 3 histórico + 12 proyectado

    // Históricos primero, formateados es-ES euros.
    assert.equal(filas[0].mes, '2026-04');
    assert.equal(filas[0].tipo, 'historico');
    assert.equal(filas[0].ingresos, '1.800,00 €');
    assert.equal(filas[0].gastos, '800,00 €');
    assert.equal(filas[0].utilidad, '1.000,00 €');
    assert.equal(filas[0].ahorroAcumulado, '1.000,00 €');
    assert.equal(filas[2].mes, '2026-06');
    assert.equal(filas[2].tipo, 'historico');

    // Proyectados después.
    assert.equal(filas[3].mes, '2026-07');
    assert.equal(filas[3].tipo, 'proyectado');
    assert.equal(filas[3].ingresos, '2.244,00 €');
    assert.equal(filas[14].mes, '2027-06');
    assert.equal(filas[14].tipo, 'proyectado');
  });
});

describe('estado vacío de la proyección (REQ-14-05)', () => {
  it('serie sin histórico se detecta vacía con mensaje que pide registrar', () => {
    const vacia = { filas_historicas: [], filas_proyectadas: [] };
    assert.equal(serieProyeccionVacia(vacia), true);
    assert.equal(serieProyeccionVacia(SERIE_HISTORICA), false);
    assert.ok(MENSAJE_SIN_HISTORICO.includes('registrar'));
    assert.ok(MENSAJE_SIN_HISTORICO.includes('primer mes'));
  });
});

describe('gráfica de proyección Chart.js (REQ-14-04/07)', () => {
  it('construye etiquetas y series alineadas con nombres del motor PyG', () => {
    const datos = datosDeGraficaProyeccion(SERIE_HISTORICA, COLORES);

    // 15 etiquetas (3 histórico + 12 proyectado) en orden.
    assert.equal(datos.etiquetas.length, 15);
    assert.deepEqual(datos.etiquetas.slice(0, 3), ['2026-04', '2026-05', '2026-06']);
    assert.deepEqual(datos.etiquetas.slice(3, 6), ['2026-07', '2026-08', '2026-09']);

    // 4 series: ingresos, gastos, utilidad, patrimonio.
    assert.equal(datos.series.length, 4);
    assert.deepEqual(
      datos.series.map((s) => s.nombre),
      ['Ingresos', 'Gastos', 'Utilidad', 'Patrimonio'],
    );
    for (const serie of datos.series) {
      assert.equal(serie.valores.length, 15);
      assert.equal(serie.tipo, 'linea');
    }
  });
});
