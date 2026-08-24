// Suite F18 refino-visual (1/2): ESTRUCTURA de tokens y hojas tocadas.
// Paridad del conjunto de nombres entre temas (REQ-18-06/F17), ausencia
// de valores sueltos en las hojas tocadas (REQ-18-01/03) y wc -l ≤100
// por archivo tocado (REQ-18-05). TDD; constantes en ./constantes.mjs.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HOJAS_TOCADAS, STYLES, leer } from './constantes.mjs';

/** Contenido del primer bloque CSS cuyo selector contiene `selector`. */
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

describe('REQ-18-06/F17: tokens.css con paridad de nombres entre temas', () => {
  const css = leer(STYLES, 'tokens.css');
  const raiz = bloque(css, ':root');
  const claro = bloque(css, "[data-theme='claro']");

  it('no supera las 100 líneas (wc -l)', () => {
    const lineas = css.split('\n').length - 1;
    assert.ok(lineas <= 100, `tokens.css tiene ${lineas} líneas`);
  });

  it('define el bloque raíz (oscuro) y el bloque claro', () => {
    assert.ok(raiz, 'falta el bloque raíz (:root)');
    assert.ok(claro, "falta el bloque [data-theme='claro']");
  });

  it('ambos temas declaran EXACTAMENTE el mismo conjunto de nombres', () => {
    const nombresRaiz = nombresDeclarados(raiz);
    const nombresClaro = nombresDeclarados(claro);
    const soloRaiz = [...nombresRaiz].filter((n) => !nombresClaro.has(n));
    const soloClaro = [...nombresClaro].filter((n) => !nombresRaiz.has(n));
    assert.deepEqual(soloRaiz, [], 'nombres solo en el tema raíz');
    assert.deepEqual(soloClaro, [], 'nombres solo en el tema claro');
    assert.ok(nombresRaiz.size > 30, 'la paleta dual está incompleta');
  });

  it('incluye el anillo de foco compartido --anillo-foco en ambos temas', () => {
    assert.ok(raiz.includes('--anillo-foco'), 'falta --anillo-foco en raíz');
    assert.ok(claro.includes('--anillo-foco'), 'falta --anillo-foco en claro');
  });
});

describe('REQ-18-01/03/05: hojas tocadas sin valores sueltos ni >100 líneas', () => {
  // Tipografía fuera de tokens (no hay tamaño tipográfico literal válido).
  const TIPOGRAFIA_SUELTA =
    /font-size\s*:\s*(?!var\()\s*[\d.]|letter-spacing\s*:|line-height\s*:/;
  // Transición/animación con duración literal o con token que no es tiempo.
  const DURACION_SUELTA = /(transition|animation)[a-z-]*\s*:[^;]*\b\d+(?:\.\d+)?m?s\b/;
  const DURACION_CON_ESPACIADO = /(transition|animation)[a-z-]*[^;]*--space-/;
  // Sombra y radio: solo referencias var(); la sombra admite «none».
  const valorDe = (css, prop) =>
    [...css.matchAll(new RegExp(`${prop}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].trim());
  const valorInvalido = (prop, v) =>
    prop === 'box-shadow' ? v !== 'none' && !v.startsWith('var(') : !v.startsWith('var(');
  // Espaciado crudo px/rem/em en padding/margin/gap.
  const ESPACIADO_SUELTO =
    /(?:^|[^-\w])(padding|margin|gap)[a-z-]*\s*:[^;]*\b\d+(?:\.\d+)?(?:px|rem|em)\b/;

  for (const hoja of HOJAS_TOCADAS) {
    it(`${hoja}: ≤100 líneas y sin valores sueltos`, () => {
      const css = leer(STYLES, hoja);
      const lineas = css.split('\n').length - 1;
      assert.ok(lineas <= 100, `${hoja} tiene ${lineas} líneas`);
      assert.ok(
        !TIPOGRAFIA_SUELTA.test(css),
        `${hoja}: tipografía fuera de tokens`,
      );
      assert.ok(
        !DURACION_SUELTA.test(css) && !DURACION_CON_ESPACIADO.test(css),
        `${hoja}: transición sin token de tiempo`,
      );
      for (const prop of ['box-shadow', 'border-radius']) {
        for (const v of valorDe(css, prop)) {
          assert.ok(!valorInvalido(prop, v), `${hoja}: ${prop} suelto "${v}"`);
        }
      }
      const lineaEspaciado = css
        .split('\n')
        .findIndex((l) => ESPACIADO_SUELTO.test(l));
      assert.equal(
        lineaEspaciado,
        -1,
        `${hoja}:${lineaEspaciado + 1}: espaciado crudo`,
      );
    });
  }
});
