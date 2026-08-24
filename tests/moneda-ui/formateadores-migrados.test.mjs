// Suite F20 (REQ-20-03), parte 1: los formateadores de las TABLAS de PyG
// y Balance producen cadenas según la MONEDA RECIBIDA en casos MXN y EUR.
// Escrito ANTES de migrar el código (TDD rojo→verde).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { filasDeTabla } from '../../src/domain/use-cases/pyg-tabla.ts';
import { filasDeTablaProyeccion as filasPygProyectado } from '../../src/domain/use-cases/pyg-proyeccion-tabla.ts';
import {
  activosAFilas,
  pasivosAFilas,
} from '../../src/domain/use-cases/balance-tabla.ts';
import { filasDeTablaBalanceFuturo } from '../../src/domain/use-cases/balance-futuro-tabla.ts';

const SERIE_PYG = {
  filas: [
    {
      mes: '2026-01',
      ingresos: 3450,
      gastos: 1874,
      utilidad: 1576,
      ahorro_acumulado: 1576,
    },
  ],
};

function seriePygProyectada() {
  return { filas_historicas: SERIE_PYG.filas, filas_proyectadas: [] };
}

const ACTIVOS = [
  { nombre: 'Cuenta', categoria: 'liquido', valor_actual: 5000 },
];
const PASIVOS = [
  { nombre: 'Préstamo', saldo_pendiente: 80000, tasa_interes_anual: 6.5 },
];

const BALANCE_FUTURO = {
  filas_historicas: [
    { mes: '2026-07', activos: 8000, pasivos: 5000, patrimonio: 3000 },
  ],
  filas_proyectadas: [],
};

describe('tablas PyG migradas reciben la moneda (REQ-20-03)', () => {
  it('pyg-tabla formatea la serie en MXN y en EUR', () => {
    const [mxn] = filasDeTabla(SERIE_PYG, 'MXN');
    const [eur] = filasDeTabla(SERIE_PYG, 'EUR');
    assert.equal(mxn.utilidad, '$1,576.00');
    assert.equal(eur.utilidad, '1.576,00 €');
    assert.equal(mxn.ingresos, '$3,450.00');
  });

  it('pyg-proyección formatea las filas proyectadas según la moneda', () => {
    const proyeccion = seriePygProyectada();
    assert.equal(
      filasPygProyectado(proyeccion, 'MXN')[0].ingresos, '$3,450.00');
    assert.equal(
      filasPygProyectado(proyeccion, 'EUR')[0].ingresos, '3.450,00 €');
  });
});

describe('tablas Balance migradas reciben la moneda (REQ-20-03)', () => {
  it('balance-tabla formatea activos y pasivos según la moneda', () => {
    assert.equal(activosAFilas(ACTIVOS, 'MXN')[0].valorActual, '$5,000.00');
    assert.equal(activosAFilas(ACTIVOS, 'EUR')[0].valorActual, '5.000,00 €');
    assert.equal(pasivosAFilas(PASIVOS, 'MXN')[0].saldoPendiente, '$80,000.00');
    assert.equal(pasivosAFilas(PASIVOS, 'EUR')[0].saldoPendiente, '80.000,00 €');
  });

  it('balance futuro formatea patrimonio proyectado según la moneda', () => {
    assert.equal(
      filasDeTablaBalanceFuturo(BALANCE_FUTURO, 'MXN')[0].patrimonio,
      '$3,000.00',
    );
    assert.equal(
      filasDeTablaBalanceFuturo(BALANCE_FUTURO, 'EUR')[0].patrimonio,
      '3.000,00 €',
    );
  });
});
