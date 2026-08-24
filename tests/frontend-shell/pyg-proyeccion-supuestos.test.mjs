// Suite F14 (2/2): lógica pura de supuestos de proyección: valores por
// defecto a cero (continuación plana, REQ-14-06), aplicación por fuente y
// categoría, restablecer e ida y vuelta de formato de variaciones.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  aplicarSupuestos,
  formatearVariacion,
  parsearVariacion,
  supuestosPorDefecto,
} from '../../src/domain/use-cases/pyg-proyeccion-supuestos.ts';

describe('supuestos de la proyección (REQ-14-03/06)', () => {
  it('supuestos por defecto son todos cero (continuación plana)', () => {
    const supuestos = supuestosPorDefecto();
    assert.deepEqual(supuestos.variacionIngresos, {});
    assert.deepEqual(supuestos.variacionGastos, {});
  });

  it('aplicarSupuestos actualiza variaciones por fuente y categoría', () => {
    let supuestos = supuestosPorDefecto();
    supuestos = aplicarSupuestos(supuestos, 'ingreso', 'salario', 0.02);
    supuestos = aplicarSupuestos(supuestos, 'gasto', 'vivienda', 0.015);

    assert.equal(supuestos.variacionIngresos.salario, 0.02);
    assert.equal(supuestos.variacionGastos.vivienda, 0.015);
  });

  it('restablecer supuestos vuelve todo a cero', () => {
    let supuestos = supuestosPorDefecto();
    supuestos = aplicarSupuestos(supuestos, 'ingreso', 'salario', 0.02);
    supuestos = aplicarSupuestos(supuestos, 'gasto', 'vivienda', 0.01);
    supuestos = aplicarSupuestos(supuestos, 'ingreso', 'freelance', 0.05);

    supuestos = supuestosPorDefecto(); // restablecer

    assert.equal(Object.keys(supuestos.variacionIngresos).length, 0);
    assert.equal(Object.keys(supuestos.variacionGastos).length, 0);
  });
});

describe('formato de variaciones % mensual', () => {
  it('formatear y parsear son inversos y toleran entrada sucia', () => {
    // Ida y vuelta exacta con decimales.
    assert.equal(parsearVariacion(formatearVariacion(0.025)), 0.025);
    // Signo negativo se conserva en ambas direcciones.
    assert.equal(formatearVariacion(parsearVariacion('-1%')), '-1.0%');
    // Entrada vacía o no numérica es continuación plana (cero).
    assert.equal(parsearVariacion(''), 0);
    assert.equal(parsearVariacion('no-es-un-numero'), 0);
  });
});
