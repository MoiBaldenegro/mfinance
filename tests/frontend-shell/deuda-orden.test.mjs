// Suite F9: ordenación de deudas (REQ-09-01/04) desde el frontend:
// avalancha por tasa desc, bola de nieve por saldo asc.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ordenAvalancha,
  ordenBolaNieve,
  deudasSegunEstrategia,
  deudaObjetivo,
} from '../../src/domain/use-cases/deuda-orden.ts';

const DEUDAS = [
  { nombre: 'Tarjeta A', saldo_pendiente: 1000, tasa_interes_anual: 18, pago_minimo_mensual: 25 },
  { nombre: 'Préstamo B', saldo_pendiente: 5000, tasa_interes_anual: 5.5, pago_minimo_mensual: 100 },
  { nombre: 'Hipoteca C', saldo_pendiente: 100000, tasa_interes_anual: 3.2, pago_minimo_mensual: 400 },
];

describe('ordenación de deudas (REQ-09-01/04)', () => {
  it('avalancha ordena por tasa descendente', () => {
    const orden = ordenAvalancha(DEUDAS);
    assert.deepEqual(orden.map((d) => d.nombre), ['Tarjeta A', 'Préstamo B', 'Hipoteca C']);
  });

  it('bola de nieve ordena por saldo ascendente', () => {
    const orden = ordenBolaNieve(DEUDAS);
    assert.deepEqual(orden.map((d) => d.nombre), ['Tarjeta A', 'Préstamo B', 'Hipoteca C']);
  });

  it('avalancha y bola difieren cuando tasa y saldo no correlacionan', () => {
    const deudas = [
      { nombre: 'Alta Tasa', saldo_pendiente: 5000, tasa_interes_anual: 20, pago_minimo_mensual: 100 },
      { nombre: 'Pequeña', saldo_pendiente: 1000, tasa_interes_anual: 5, pago_minimo_mensual: 25 },
      { nombre: 'Grande', saldo_pendiente: 20000, tasa_interes_anual: 10, pago_minimo_mensual: 400 },
    ];
    assert.deepEqual(
      ordenAvalancha(deudas).map((d) => d.nombre),
      ['Alta Tasa', 'Grande', 'Pequeña'],
    );
    assert.deepEqual(
      ordenBolaNieve(deudas).map((d) => d.nombre),
      ['Pequeña', 'Alta Tasa', 'Grande'],
    );
  });

  it('deudasSegunEstrategia delega correctamente', () => {
    assert.deepEqual(
      deudasSegunEstrategia(DEUDAS, 'Avalanche').map((d) => d.nombre),
      ['Tarjeta A', 'Préstamo B', 'Hipoteca C'],
    );
    assert.deepEqual(
      deudasSegunEstrategia(DEUDAS, 'Snowball').map((d) => d.nombre),
      ['Tarjeta A', 'Préstamo B', 'Hipoteca C'],
    );
  });

  it('deudaObjetivo devuelve la primera según estrategia', () => {
    const deudas = [
      { nombre: 'Alta Tasa', saldo_pendiente: 5000, tasa_interes_anual: 20, pago_minimo_mensual: 100 },
      { nombre: 'Pequeña', saldo_pendiente: 1000, tasa_interes_anual: 5, pago_minimo_mensual: 25 },
    ];
    assert.equal(deudaObjetivo(deudas, 'Avalanche')?.nombre, 'Alta Tasa');
    assert.equal(deudaObjetivo(deudas, 'Snowball')?.nombre, 'Pequeña');
    assert.equal(deudaObjetivo([], 'Avalanche'), null);
  });
});