import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatoPorcentaje } from '../../src/domain/use-cases/formato-porcentaje.ts';
import { etiquetaMes, etiquetaMesCorta } from '../../src/domain/use-cases/etiqueta-mes.ts';

test('formatoPorcentaje usa el separador decimal de la moneda', () => {
  assert.equal(formatoPorcentaje(12.5, 'MXN'), '12.5 %');
  assert.equal(formatoPorcentaje(12.5, 'EUR'), '12,5 %');
  assert.equal(formatoPorcentaje(3, 'USD', 2), '3.00 %');
});

test('formatoPorcentaje no muestra NaN ni Infinity', () => {
  assert.equal(formatoPorcentaje(Number.NaN, 'MXN'), '0.0 %');
  assert.equal(formatoPorcentaje(Number.POSITIVE_INFINITY, 'MXN'), '0.0 %');
});

test('etiquetaMes produce el mes en español', () => {
  assert.equal(etiquetaMes('2026-09'), 'septiembre 2026');
  assert.equal(etiquetaMes('2027-01'), 'enero 2027');
  assert.equal(etiquetaMesCorta('2026-12'), 'dic 2026');
});

test('etiquetaMes devuelve tal cual lo que no es YYYY-MM', () => {
  assert.equal(etiquetaMes('2026-13'), '2026-13');
  assert.equal(etiquetaMes('mes'), 'mes');
  assert.equal(etiquetaMesCorta('x'), 'x');
});

import { etiquetaFamiliaProyeccion, importeDeTexto } from '../../src/domain/use-cases/inversiones-proyeccion.ts';

test('etiquetaFamiliaProyeccion traduce las claves de la proyección', () => {
  assert.equal(etiquetaFamiliaProyeccion('finca_raiz'), 'Finca raíz');
  assert.equal(etiquetaFamiliaProyeccion('renta_fija'), 'Renta fija');
  assert.equal(etiquetaFamiliaProyeccion('otra'), 'otra');
});

test('importeDeTexto admite decimales con punto o coma y vacíos', () => {
  assert.equal(importeDeTexto('1.5'), 1.5);
  assert.equal(importeDeTexto('2,25'), 2.25);
  assert.equal(importeDeTexto(''), 0);
  assert.equal(importeDeTexto('-3'), 0);
  assert.equal(importeDeTexto('abc'), 0);
});

import { estadoIndicador, valorIndicador, ORDEN_INDICADORES } from '../../src/domain/use-cases/indicadores-presentacion.ts';

test('indicadores: estado legible y valor con unidad', () => {
  assert.equal(estadoIndicador('verde'), 'Saludable');
  assert.equal(estadoIndicador('rojo'), 'Crítico');
  const ind = { nombre: 'x', valor: 2.45, clasificacion: 'amarillo', sin_datos: false, explicacion: null };
  assert.equal(valorIndicador('fondo_emergencia', ind, 'MXN'), '2.5 meses');
  assert.equal(valorIndicador('tasa_ahorro', ind, 'EUR'), '2,5 %');
  assert.equal(ORDEN_INDICADORES.length, 4);
});
