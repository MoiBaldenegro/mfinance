import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { it } from 'node:test';

const raiz = join(import.meta.dirname, '..', '..');
const loader = join(raiz, 'tests/fixtures/rollback-perfil-vista/tsx-loader.mjs');
const escenario = join(raiz, 'tests/fixtures/rollback-perfil-vista/modal-real.mjs');

it('presenta el diálogo y la salida segura con el diagnóstico una sola vez', () => {
  const resultado = spawnSync(process.execPath, ['--experimental-loader', pathToFileURL(loader).href, escenario], {
    cwd: raiz, encoding: 'utf8',
  });
  assert.equal(resultado.status, 0, `${resultado.stdout}\n${resultado.stderr}`);
});
