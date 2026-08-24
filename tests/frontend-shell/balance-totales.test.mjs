// Suite F8: totales de balance (activos, pasivos, patrimonio) desde
// el snapshot, con signo correcto (REQ-08-03/04).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  calcularTotalesBalance,
} from '../../src/domain/use-cases/balance-totales.ts';

const SNAPSHOT = {
  monthly_records: [],
  assets: [
    { nombre: 'Efectivo', categoria: 'liquido', valor_actual: 10000 },
    { nombre: 'Acciones', categoria: 'inversion', valor_actual: 25000 },
    { nombre: 'Piso', categoria: 'propiedad', valor_actual: 150000 },
  ],
  liabilities: [
    { nombre: 'Hipoteca', saldo_pendiente: 120000, tasa_interes_anual: 3.2 },
    { nombre: 'Préstamo coche', saldo_pendiente: 8000, tasa_interes_anual: 5.5 },
  ],
  investments: [],
  account_statements: [],
  strategy: { debt_strategy: 'Avalanche', extra_monthly_payment: 0 },
};

describe('totales de balance desde snapshot (REQ-08-03/04)', () => {
  it('suma activos, pasivos y calcula patrimonio = activos - pasivos', () => {
    const totales = calcularTotalesBalance(SNAPSHOT);
    assert.equal(totales.activos, 185000);
    assert.equal(totales.pasivos, 128000);
    assert.equal(totales.patrimonio, 57000);
  });

  it('solo activos -> patrimonio igual a activos', () => {
    const soloActivos = { ...SNAPSHOT, liabilities: [] };
    const totales = calcularTotalesBalance(soloActivos);
    assert.equal(totales.activos, 185000);
    assert.equal(totales.pasivos, 0);
    assert.equal(totales.patrimonio, 185000);
  });

  it('solo pasivos -> patrimonio negativo igual a -pasivos', () => {
    const soloPasivos = { ...SNAPSHOT, assets: [] };
    const totales = calcularTotalesBalance(soloPasivos);
    assert.equal(totales.activos, 0);
    assert.equal(totales.pasivos, 128000);
    assert.equal(totales.patrimonio, -128000);
  });

  it('vacío -> todo cero', () => {
    const vacio = { ...SNAPSHOT, assets: [], liabilities: [] };
    const totales = calcularTotalesBalance(vacio);
    assert.equal(totales.activos, 0);
    assert.equal(totales.pasivos, 0);
    assert.equal(totales.patrimonio, 0);
  });
});