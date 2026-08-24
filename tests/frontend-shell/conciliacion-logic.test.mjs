// Suite F11: lógica de conciliación (cálculo diferencia, estado
// conciliado/descuadrada, validaciones) sin React ni IPC.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  saldoTeorico,
  diferencia,
  estaConciliada,
} from '../../src/domain/entities/account-statement.ts';

const ESTADO_CONCILIADA = {
  cuenta: 'Cuenta A',
  saldo_inicial: 1000,
  movimientos: [
    { fecha: '2026-07-01', concepto: 'Ingreso', importe: 500 },
    { fecha: '2026-07-05', concepto: 'Gasto', importe: -200 },
  ],
  saldo_final: 1300, // 1000 + 500 - 200 = 1300
};

const ESTADO_DESCUADRADA = {
  cuenta: 'Cuenta B',
  saldo_inicial: 1000,
  movimientos: [
    { fecha: '2026-07-01', concepto: 'Ingreso', importe: 500 },
    { fecha: '2026-07-05', concepto: 'Gasto', importe: -200 },
  ],
  saldo_final: 1250, // teórico 1300, real 1250 -> diferencia -50
};

const ESTADO_SIN_MOVIMIENTOS = {
  cuenta: 'Cuenta C',
  saldo_inicial: 500,
  movimientos: [],
  saldo_final: 500,
};

describe('lógica de conciliación (REQ-13-02..04)', () => {
  it('saldoTeorico = inicial + suma algebraica movimientos', () => {
    assert.equal(saldoTeorico(ESTADO_CONCILIADA), 1300);
    assert.equal(saldoTeorico(ESTADO_DESCUADRADA), 1300);
    assert.equal(saldoTeorico(ESTADO_SIN_MOVIMIENTOS), 500);
  });

  it('diferencia = real - teórico', () => {
    assert.equal(diferencia(ESTADO_CONCILIADA), 0); // 1300 - 1300
    assert.equal(diferencia(ESTADO_DESCUADRADA), -50); // 1250 - 1300
    assert.equal(diferencia(ESTADO_SIN_MOVIMIENTOS), 0); // 500 - 500
  });

  it('estaConciliada true cuando diferencia < 0.005', () => {
    assert.equal(estaConciliada(ESTADO_CONCILIADA), true);
    assert.equal(estaConciliada(ESTADO_SIN_MOVIMIENTOS), true);
  });

  it('estaConciliada false cuando diferencia >= 0.005', () => {
    assert.equal(estaConciliada(ESTADO_DESCUADRADA), false);
  });

  it('tolerancia medio céntimo: 0.004 es conciliada, 0.005 no', () => {
    const casi = { ...ESTADO_CONCILIADA, saldo_final: 1300.004 };
    assert.equal(estaConciliada(casi), true);
    const limite = { ...ESTADO_CONCILIADA, saldo_final: 1300.005 };
    assert.equal(estaConciliada(limite), false);
  });
});