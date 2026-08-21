import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Tests de la feature 2 (harness-tooling-tauri) sobre los archivos reales del
// arnés: codifican REQ-02-01, REQ-02-03/04, REQ-02-06/07 y REQ-02-08 de
// specs/02_harness-tooling-tauri/requirements.md. Solo stdlib de Node.
// Los tests del validador con fixtures viven en
// tests/harness-tooling-tauri-validator.test.mjs.

const ROOT = new URL('../', import.meta.url);

function read(rel) {
  return readFileSync(new URL(rel, ROOT), 'utf8');
}

test('REQ-02-01: package.json declara exactamente "test": "node --test"', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.test, 'node --test');
});

test('REQ-02-03/04: init.sh comprueba rustc y cargo antes del bloque Build, con fallo nombrado vía rustup.rs', () => {
  const init = read('init.sh');
  const rustcCheck = init.indexOf('command -v rustc');
  const cargoCheck = init.indexOf('command -v cargo');
  const buildBlock = init.indexOf('--- Build ---');
  assert.ok(rustcCheck !== -1, 'init.sh: falta el check de rustc');
  assert.ok(cargoCheck !== -1, 'init.sh: falta el check de cargo');
  assert.ok(buildBlock !== -1, 'init.sh: no se encuentra el bloque Build');
  assert.ok(rustcCheck < buildBlock, 'init.sh: el check de rustc debe ir ANTES del bloque Build');
  assert.ok(cargoCheck < buildBlock, 'init.sh: el check de cargo debe ir ANTES del bloque Build');
  assert.match(init, /rustup\.rs/, 'init.sh: el fallo debe indicar instalación vía https://rustup.rs');
});

test('REQ-02-06/07: los manifiestos reales quedan totalmente cubiertos por docs/dependencies.md', async () => {
  const { validateDependencies } = await import('../scripts/validate-dependencies.mjs');
  assert.deepEqual(validateDependencies(), [], 'el registro real debe cubrir package.json y Cargo.toml al 100%');
});

test('REQ-02-08: docs/dependencies.md incluye nota de procedencia (scaffold Tauri, humano, veto)', () => {
  const doc = read('docs/dependencies.md').toLowerCase();
  for (const clave of ['scaffold', 'humano', 'veto']) {
    assert.ok(doc.includes(clave), `docs/dependencies.md: la nota de procedencia debe mencionar "${clave}"`);
  }
});
