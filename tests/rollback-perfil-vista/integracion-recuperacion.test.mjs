// F38 ronda 3: la integración monta React real en un proceso SSR sin DOM.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';

const raiz = join(import.meta.dirname, '..', '..');
const loader = join(raiz, 'tests/fixtures/rollback-perfil-vista/tsx-loader.mjs');
const escenario = join(raiz, 'tests/fixtures/rollback-perfil-vista/render-real.mjs');

describe('integración React de recuperación completa', () => {
  it('monta App, AppShell, cabecera, navegación y cuerpo en el flujo real', () => {
    const resultado = spawnSync(process.execPath, ['--experimental-loader', pathToFileURL(loader).href, escenario], {
      cwd: raiz, encoding: 'utf8',
    });
    assert.equal(resultado.status, 0, `${resultado.stdout}\n${resultado.stderr}`);
  });
});
