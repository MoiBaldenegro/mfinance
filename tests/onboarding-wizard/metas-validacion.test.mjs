// REQ-27-03/04 + REQ-23-11: validación cliente de metas COINCIDENTE con
// la del backend (GoalEntry::nueva en Rust): límites y trim idénticos.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { LIMITES_META, validarMeta } from '../../src/domain/entities/goal-entry.ts';

function entradaValida(overrides = {}) {
  return {
    titulo: overrides.titulo ?? 'Comprar casa',
    descripcion: overrides.descripcion ?? 'Entrada del 20% en 5 años',
    tags: overrides.tags ?? ['casa', 'ahorro'],
  };
}

describe('validarMeta — coincidente con backend GoalEntry (REQ-23-11)', () => {
  it('límites idénticos a los constantes del dominio Rust', () => {
    assert.equal(LIMITES_META.titulo, 100);
    assert.equal(LIMITES_META.descripcion, 5000);
    assert.equal(LIMITES_META.etiquetas, 5);
    assert.equal(LIMITES_META.etiqueta, 20);
  });

  it('acepta título 100, descripción 5000 y 5 etiquetas de 20', () => {
    const entrada = {
      titulo: 'x'.repeat(100),
      descripcion: 'y'.repeat(5000),
      tags: ['a'.repeat(20), 'b'.repeat(20), 'c', 'd', 'e'],
    };
    assert.deepEqual(validarMeta(entrada), []);
  });

  it('título vacío o solo espacios → aviso en el campo titulo', () => {
    for (const titulo of ['', '   ']) {
      const avisos = validarMeta(entradaValida({ titulo }));
      const aviso = avisos.find((a) => a.campo === 'titulo');
      assert.ok(aviso && /obligatorio/.test(aviso.mensaje));
    }
  });

  it('título de 101 caracteres → aviso con el límite', () => {
    const avisos = validarMeta(entradaValida({ titulo: 'x'.repeat(101) }));
    assert.ok(avisos.some((a) => a.campo === 'titulo' && /100/.test(a.mensaje)));
  });

  it('descripción de 5001 caracteres → aviso con el límite', () => {
    const avisos = validarMeta(entradaValida({ descripcion: 'y'.repeat(5001) }));
    assert.ok(avisos.some((a) => a.campo === 'descripcion' && /5000/.test(a.mensaje)));
  });

  it('6 etiquetas → aviso; etiqueta vacía → aviso; etiqueta de 21 → aviso', () => {
    const seis = validarMeta(entradaValida({ tags: ['a', 'b', 'c', 'd', 'e', 'f'] }));
    assert.ok(seis.some((a) => a.campo === 'tags' && /5 etiquetas/.test(a.mensaje)));
    const vacia = validarMeta(entradaValida({ tags: ['ok', '  '] }));
    assert.ok(vacia.some((a) => a.campo === 'tags' && /vacías/.test(a.mensaje)));
    const larga = validarMeta(entradaValida({ tags: ['z'.repeat(21)] }));
    assert.ok(larga.some((a) => a.campo === 'tags' && /20 caracteres/.test(a.mensaje)));
  });
});
