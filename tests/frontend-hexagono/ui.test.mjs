// Suite F5 hexágono (2/2): UI conforme a tokens (REQ-05-05) y sin CSS
// embebido en componentes (REQ-05-06), verificadas sobre el árbol real.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SRC, archivosTs, relativa } from './utils.mjs';

const todosLosArchivos = archivosTs(SRC);

describe('REQ-05-06: sin CSS embebido en componentes', () => {
  it('cada .tsx visual importa su hoja desde src/styles y esa hoja existe', () => {
    const problemas = [];
    for (const ruta of todosLosArchivos) {
      if (!ruta.endsWith('.tsx')) continue;
      // SnapshotProvider es glue de contexto sin marcado propio: no pinta
      // nada y por tanto no lleva hoja (excepción documentada).
      if (ruta.endsWith('SnapshotProvider.tsx')) continue;
      // AcordeonSeccion (feature 34) es un wrapper estructural de <details>
      // sin marcado propio: reutiliza las hojas de las secciones que lo
      // consumen (excepción documentada).
      if (ruta.endsWith('AcordeonSeccion.tsx')) continue;
      const contenido = readFileSync(ruta, 'utf8');
      const hoja = contenido.match(
        /import\s+["']([^"']*styles\/[a-z0-9-]+\.css)["']/,
      );
      if (!hoja) {
        problemas.push(`${relativa(ruta)}: no importa hoja de src/styles`);
        continue;
      }
      const rutaHoja = join(
        SRC,
        hoja[1].replace(/^\.\.\/\.\.\//, '').replace(/^\.\.\//, ''),
      );
      if (!existsSync(rutaHoja)) problemas.push(`${relativa(ruta)}: hoja inexistente`);
      // Permitir style={{ '--custom-prop': value }} para variables CSS dinámicas
// y style={{ width: '...%' }} para barras de progreso (excepción documentada).
const styleMatches = contenido.match(/style=\{\{[^}]*\}\}/g) ?? [];
const tieneStyleEmbedded = styleMatches.some(m => {
  const inner = m.slice(8, -2).trim(); // quitar style={{ }}
  return !inner.startsWith('--') && !inner.startsWith('width');
});
if (tieneStyleEmbedded || /<style/.test(contenido)) {
  problemas.push(`${relativa(ruta)}: CSS embebido`);
}
    }
    assert.deepEqual(problemas, []);
  });
});

describe('REQ-05-05: tokens.css completo', () => {
  const tokens = readFileSync(join(SRC, 'styles', 'tokens.css'), 'utf8');
  const requeridos = [
    '--color-bg',
    '--color-surface',
    '--color-primary',
    '--color-text',
    '--color-muted',
    '--space-1',
    '--space-2',
    '--space-3',
    '--space-4',
    '--space-5',
    '--space-6',
    '--space-7',
    '--space-8',
    '--radius-md',
    '--shadow-card',
    '--font-sans',
    '--color-positive',
    '--color-warn',
    '--color-negative',
  ];

  it('define todas las custom properties del design.md', () => {
    const faltantes = requeridos.filter((token) => !tokens.includes(token));
    assert.deepEqual(faltantes, []);
  });
});
