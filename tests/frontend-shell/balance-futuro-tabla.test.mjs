// Suite F14 (1/2): tabla y gráfica del balance futuro proyectado con
// distinción histórico/proyectado y estado vacío en español (REQ-14-04/05).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  filasDeTablaBalanceFuturo,
  balanceFuturoVacio,
  MENSAJE_SIN_BALANCE_HISTORICO,
  datosDeGraficaBalanceFuturo,
} from '../../src/domain/use-cases/balance-futuro.ts';
import { BALANCE_FUTURO, COLORES_BALANCE } from './fixtures-proyeccion.mjs';

describe('tabla de balance futuro (REQ-14-02/04)', () => {
  it('transforma balance futuro en filas con marca histórico/proyectado', () => {
    const filas = filasDeTablaBalanceFuturo(BALANCE_FUTURO, 'EUR');
    assert.equal(filas.length, 15); // 3 histórico + 12 proyectado

    assert.equal(filas[0].mes, '2026-04');
    assert.equal(filas[0].tipo, 'historico');
    assert.equal(filas[0].activos, '8.000,00 €');
    assert.equal(filas[0].pasivos, '5.000,00 €');
    assert.equal(filas[0].patrimonio, '3.000,00 €');

    assert.equal(filas[2].mes, '2026-06');
    assert.equal(filas[2].tipo, 'historico');

    assert.equal(filas[3].mes, '2026-07');
    assert.equal(filas[3].tipo, 'proyectado');
    assert.equal(filas[3].activos, '11.234,00 €');

    assert.equal(filas[14].mes, '2027-06');
    assert.equal(filas[14].tipo, 'proyectado');
  });
});

describe('estado vacío del balance futuro (REQ-14-05)', () => {
  it('balance sin histórico se detecta vacío con mensaje que pide registrar', () => {
    const vacio = { filas_historicas: [], filas_proyectadas: [] };
    assert.equal(balanceFuturoVacio(vacio), true);
    assert.equal(balanceFuturoVacio(BALANCE_FUTURO), false);
    assert.ok(MENSAJE_SIN_BALANCE_HISTORICO.includes('registrar'));
    assert.ok(MENSAJE_SIN_BALANCE_HISTORICO.includes('primer mes'));
  });
});

describe('gráfica Chart.js del balance futuro (REQ-14-04/07)', () => {
  it('construye etiquetas y las tres series de líneas', () => {
    const datos = datosDeGraficaBalanceFuturo(BALANCE_FUTURO, COLORES_BALANCE);

    assert.equal(datos.etiquetas.length, 15);
    assert.deepEqual(datos.etiquetas.slice(0, 3), ['2026-04', '2026-05', '2026-06']);

    assert.equal(datos.series.length, 3);
    assert.deepEqual(
      datos.series.map((s) => s.nombre),
      ['Activos', 'Pasivos', 'Patrimonio'],
    );
    for (const serie of datos.series) {
      assert.equal(serie.valores.length, 15);
      assert.equal(serie.tipo, 'linea'); // Balance usa líneas
    }
  });
});
