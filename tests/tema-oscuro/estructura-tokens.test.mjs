// Suite F17 tema-oscuro-tokens (1/2): estructura del archivo dual
// tokens.css (REQ-17-05): paleta OSCURA por defecto en :root, paleta CLARA
// bajo el atributo data-theme=claro con los MISMOS nombres de token,
// máximo 100 líneas, nombres históricos intactos y grid/ticks nuevos.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const RUTA = join(dirname(fileURLToPath(import.meta.url)),
  '..', '..', 'src', 'styles', 'tokens.css');

/** Contenido del bloque CSS cuyo selector contiene `selector`. */
function bloque(css, selector) {
  const idx = css.indexOf(selector);
  if (idx === -1) return null;
  const apertura = css.indexOf('{', idx);
  const cierre = css.indexOf('}', apertura);
  if (apertura === -1 || cierre === -1) return null;
  return css.slice(apertura + 1, cierre);
}

function nombresDeclarados(bloqueCss) {
  return new Set(
    [...bloqueCss.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]),
  );
}

describe('REQ-17-05: tokens.css dual ≤100 líneas', () => {
  const css = readFileSync(RUTA, 'utf8');
  const raiz = bloque(css, ':root');
  const claro = bloque(css, "[data-theme='claro']");

  it('no supera las 100 líneas (wc -l)', () => {
    const lineas = css.split('\n').length - 1; // como wc -l
    assert.ok(lineas <= 100, `tokens.css tiene ${lineas} líneas`);
  });

  it('define el bloque oscuro en :root y el claro bajo [data-theme=claro]', () => {
    assert.ok(raiz, 'falta el bloque :root');
    assert.ok(claro, "falta el bloque [data-theme='claro']");
  });

  it('ambos bloques declaran los MISMOS nombres de token de paleta', () => {
    const nombresRaiz = nombresDeclarados(raiz);
    const nombresClaro = nombresDeclarados(claro);
    // Sin nombres inventados: todo nombre del claro existe en :root.
    const inventados = [...nombresClaro].filter((n) => !nombresRaiz.has(n));
    assert.deepEqual(inventados, []);
    // Toda token cruda de paleta de :root (valor sin var()) se redeclara
    // con el mismo nombre en el claro: misma paleta, mismos nombres.
    const crudas = new Set();
    for (const m of raiz.matchAll(/(--(?:color|chart|shadow|sombra)[a-zA-Z0-9-]*)\s*:\s*([^;]+);/g)) {
      if (!m[2].includes('var(')) crudas.add(m[1]);
    }
    const sinOverride = [...crudas].filter((n) => !nombresClaro.has(n));
    assert.deepEqual(sinOverride, []);
    assert.ok(nombresClaro.size > 0, 'el bloque claro no declara tokens');
  });

  it(':root es oscuro por defecto y difiere del claro', () => {
    const fondoRaiz = /--color-bg\s*:\s*([^;]+);/.exec(raiz)[1];
    const fondoClaro = /--color-bg\s*:\s*([^;]+);/.exec(claro)[1];
    assert.notEqual(fondoRaiz.trim().toLowerCase(), '#f4f5f2',
      ':root conserva la paleta clara antigua como default');
    assert.notEqual(fondoRaiz.trim(), fondoClaro.trim(),
      ':root y [data-theme=claro] comparten --color-bg');
  });

  it('conserva los nombres históricos y añade grid/ticks de gráfica', () => {
    for (const nombre of [
      '--color-bg', '--color-surface', '--color-primary', '--color-text',
      '--color-muted', '--color-border', '--color-positive', '--color-warn',
      '--color-negative', '--chart-color-1', '--chart-color-2',
      '--chart-color-3', '--chart-border', '--chart-grid', '--chart-ticks',
      '--space-1', '--radius-md', '--shadow-card', '--font-sans',
    ]) {
      assert.ok(css.includes(nombre), `falta ${nombre}`);
    }
  });
});
