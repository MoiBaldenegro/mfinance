// Tests de formateo y aportes de inversiones-proyeccion (REQ-11-06/07).
// F20: el formateo sin decimales se delega en el núcleo multi-moneda
// (formatearProyeccion recibe la moneda); casos EUR heredados del ciclo F11.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const { formatearProyeccion, sumarAportes } = await import(
  '../../src/domain/use-cases/inversiones-proyeccion.ts'
);

describe('formatearProyeccion - REQ-11-07: euros sin decimales (moneda EUR)', () => {
  it('redondea a entero y agrupa los miles', () => {
    assert.strictEqual(formatearProyeccion(1234.56, 'EUR'), '1.235 €');
    assert.strictEqual(formatearProyeccion(1234.49, 'EUR'), '1.234 €');
  });

  it('miles con separador', () => {
    assert.strictEqual(formatearProyeccion(20465.5, 'EUR'), '20.466 €');
    assert.strictEqual(formatearProyeccion(79306.13, 'EUR'), '79.306 €');
  });

  it('cero', () => {
    assert.strictEqual(formatearProyeccion(0, 'EUR'), '0 €');
  });

  it('valores pequeños', () => {
    assert.strictEqual(formatearProyeccion(0.4, 'EUR'), '0 €');
    assert.strictEqual(formatearProyeccion(0.5, 'EUR'), '1 €');
  });

  it('moneda recibida MXN con separadores del catálogo', () => {
    assert.strictEqual(formatearProyeccion(20465.5, 'MXN'), '$20,466');
  });
});

describe('sumarAportes - REQ-11-06: total aportes mensuales', () => {
  it('suma aportes de todas las familias', () => {
    const familias = [
      { familia: 'renta_fija', aporte_mensual: 150 },
      { familia: 'renta_variable', aporte_mensual: 250 },
      { familia: 'finca_raiz', aporte_mensual: 300 },
    ];
    assert.strictEqual(sumarAportes(familias), 700);
  });

  it('array vacío devuelve 0', () => {
    assert.strictEqual(sumarAportes([]), 0);
  });

  it('una sola familia', () => {
    const familias = [{ familia: 'renta_fija', aporte_mensual: 100 }];
    assert.strictEqual(sumarAportes(familias), 100);
  });
});
