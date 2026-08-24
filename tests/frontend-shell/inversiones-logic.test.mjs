// Tests de lógica pura para inversiones-proyeccion: cálculo VF y
// validación de tasa. El formateo y los aportes viven en
// inversiones-formato.test.mjs (misma entidad, archivo ≤100 líneas).

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// Lógica pura del caso de uso de inversiones.
const { calcularVF, validarTasa } = await import(
  '../../src/domain/use-cases/inversiones-proyeccion.ts'
);

describe('inversiones-proyeccion: lógica pura', () => {
  describe('calcularVF - valor futuro con capitalización mensual', () => {
    it('VF = PV*(1+r_m)^n + PMT*((1+r_m)^n-1)/r_m para tasa > 0', () => {
      // valor_actual=10000, aporte_mensual=100, tasa=6%, 5 años
      // r_m = 0.06/12 = 0.005, n = 60
      // VF = 10000*(1.005)^60 + 100*((1.005)^60-1)/0.005
      //    = 10000*1.34885015 + 100*0.34885015/0.005
      //    = 13488.50 + 6977.00 = 20465.50
      const vf5 = calcularVF(10000, 100, 6, 5);
      assert.ok(Math.abs(vf5 - 20465.50) < 0.01, `5 años: ${vf5}`);

      const vf10 = calcularVF(10000, 100, 6, 10);
      assert.ok(Math.abs(vf10 - 34581.90) < 0.01, `10 años: ${vf10}`);

      const vf20 = calcularVF(10000, 100, 6, 20);
      assert.ok(Math.abs(vf20 - 79306.13) < 0.01, `20 años: ${vf20}`);
    });

    it('VF = PV + PMT * n cuando tasa = 0 (evita división por cero)', () => {
      // 5 años: 10000 + 100*60 = 16000
      assert.strictEqual(calcularVF(10000, 100, 0, 5), 16000);
      // 10 años: 10000 + 100*120 = 22000
      assert.strictEqual(calcularVF(10000, 100, 0, 10), 22000);
      // 20 años: 10000 + 100*240 = 34000
      assert.strictEqual(calcularVF(10000, 100, 0, 20), 34000);
    });

    it('tasa 30% válida (límite superior)', () => {
      const vf = calcularVF(10000, 100, 30, 5);
      assert.ok(vf > 10000);
    });
  });

  describe('validarTasa - REQ-11-05: tasa en [0, 30]', () => {
    it('tasa negativa rechazada', () => {
      const resultado = validarTasa(-1);
      assert.ok(!resultado.valida);
      assert.match(resultado.mensaje, /negativa|menor que 0/i);
    });

    it('tasa > 30 rechazada', () => {
      const resultado = validarTasa(35);
      assert.ok(!resultado.valida);
      assert.match(resultado.mensaje, /30/i);
    });

    it('tasa 0 válida', () => {
      const resultado = validarTasa(0);
      assert.ok(resultado.valida);
      assert.strictEqual(resultado.mensaje, '');
    });

    it('tasa 30 válida', () => {
      const resultado = validarTasa(30);
      assert.ok(resultado.valida);
      assert.strictEqual(resultado.mensaje, '');
    });

    it('tasa 15 válida (valor típico)', () => {
      const resultado = validarTasa(15);
      assert.ok(resultado.valida);
      assert.strictEqual(resultado.mensaje, '');
    });
  });
});
