// Suite F18 refino-visual (2/2): INTERACCIÓN y estados compartidos.
// :focus-visible uniforme en shell y formularios (REQ-18-02) y patrón
// común de estados vacíos/carga referenciado por Registro PyG Balance e
// Inversiones con sus clases usadas en los .tsx (REQ-18-04). Escrita
// antes del código (TDD); constantes compartidas en ./constantes.mjs.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  COMPONENTS,
  CON_FOCUS_VISIBLE,
  STYLES,
  leer,
} from './constantes.mjs';

describe('REQ-18-02: :focus-visible uniforme en shell y formularios', () => {
  for (const hoja of CON_FOCUS_VISIBLE) {
    it(`${hoja} define :focus-visible`, () => {
      const css = leer(STYLES, hoja);
      assert.ok(
        css.includes(':focus-visible'),
        `${hoja} no define :focus-visible`,
      );
    });
  }
});

describe('REQ-18-04: patrón común de estados vacíos y de carga', () => {
  const comunes = leer(STYLES, 'estados-comunes.css');
  // Vistas que componen las clases compartidas en su marcado.
  const usos = new Map([
    ['pyg-section/PygSection.tsx', ['estado-vacio', 'estado-carga']],
    ['balance-section/BalanceSection.tsx', ['estado-vacio', 'estado-carga']],
    ['inversiones-section/InversionesSection.tsx', ['estado-carga']],
    ['inversiones-section/GraficaProyeccion.tsx', ['estado-carga']],
  ]);

  it('estados-comunes.css existe y define .estado-vacio y .estado-carga', () => {
    assert.ok(comunes.includes('.estado-vacio'), 'falta .estado-vacio');
    assert.ok(comunes.includes('.estado-carga'), 'falta .estado-carga');
  });

  it('la hoja compartida la referencian Registro PyG Balance e Inversiones', () => {
    for (const seccion of [
      'registro-section.css',
      'pyg-section.css',
      'balance-section.css',
      'inversiones-section.css',
    ]) {
      const css = leer(STYLES, seccion);
      assert.ok(
        css.includes('estados-comunes'),
        `${seccion} no referencia estados-comunes.css`,
      );
    }
  });

  it('las vistas usan las clases compartidas en su marcado', () => {
    for (const [archivo, clases] of usos) {
      const tsx = leer(COMPONENTS, ...archivo.split('/'));
      for (const clase of clases) {
        assert.ok(tsx.includes(clase), `${archivo} no usa .${clase}`);
      }
    }
  });

  it('los .tsx ajustados no incorporan CSS embebido', () => {
    for (const archivo of usos.keys()) {
      const tsx = leer(COMPONENTS, ...archivo.split('/'));
      assert.ok(!/style=\{\{|<style/.test(tsx), `${archivo}: CSS embebido`);
    }
  });
});
