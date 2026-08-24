// Suite feature 16 (2/5): presupuesto del mes siguiente (REQ-16-02):
// pre-relleno con el promedio móvil, edición por categoría y construcción
// de la petición de cierre con validación campo a campo.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  textosDesdeSugerido,
  totalPresupuesto,
  construirPresupuesto,
} from '../../src/domain/use-cases/presupuesto-siguiente.ts';
import { EXPENSE_CATEGORIES } from '../../src/domain/entities/catalogs.ts';

describe('presupuesto del mes siguiente (REQ-16-02)', () => {
  it('pre-rellena los textos con el promedio móvil sugerido', () => {
    const textos = textosDesdeSugerido({ Vivienda: 1000, Ocio: 200.5 });
    assert.equal(textos.Vivienda, '1000');
    assert.equal(textos.Ocio, '200,5');
    // Toda categoría del catálogo tiene texto (vacío si no hay sugerencia).
    for (const clave of EXPENSE_CATEGORIES) {
      assert.ok(clave in textos);
    }
    assert.equal(textos.Transporte, '');
  });

  it('el total recalcula en vivo desde los textos editados', () => {
    const textos = { Vivienda: '950,50', Ocio: '120', Transporte: '' };
    assert.ok(Math.abs(totalPresupuesto(textos) - 1070.5) < 1e-9);
  });

  it('construye la petición omitiendo vacíos y ceros', () => {
    const resultado = construirPresupuesto('2026-07', {
      Vivienda: '1000',
      Ocio: '',
      Transporte: '0',
    });
    assert.equal(resultado.ok, true);
    assert.deepEqual(resultado.presupuesto, { Vivienda: 1000 });
  });

  it('rechaza importes negativos o no numéricos campo a campo', () => {
    const resultado = construirPresupuesto('2026-07', {
      Vivienda: '-5',
      Ocio: 'abc',
    });
    assert.equal(resultado.ok, false);
    const claves = resultado.errores.map((error) => error.clave);
    assert.ok(claves.includes('gasto:Vivienda'));
    assert.ok(claves.includes('gasto:Ocio'));
    for (const error of resultado.errores) {
      assert.ok(error.mensaje.length > 0);
    }
  });
});
