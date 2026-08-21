import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Tests del validador de dependencias extendido a Cargo.toml (feature 2):
// codifican REQ-02-05 y REQ-02-10 contra fixtures de registro+manifiestos.
// Solo stdlib de Node; los tests sobre archivos reales viven en
// tests/harness-tooling-tauri.test.mjs.

const { validateDependencies, parseCargoManifest } = await import('../scripts/validate-dependencies.mjs');

const PKG_OK = JSON.stringify({
  dependencies: { react: '^19.1.0' },
  devDependencies: { typescript: '~5.8.3' },
});

const CARGO_OK = [
  '[package]',
  'name = "mfinance"',
  '',
  '[dependencies]',
  'tauri = { version = "2", features = [] }',
  'serde_json = "1"',
  '',
  '[build-dependencies]',
  'tauri-build = { version = "2", features = [] }',
  '',
  '[dev-dependencies]',
  'pretty_assertions = "1"',
].join('\n');

function registry(entries) {
  return entries.map(([pkg, version, scope, motivo]) =>
    [`### ${pkg}`, '', `- version: ${version}`, `- scope: ${scope}`, '- approved: 2026-08-21', `- motivo: ${motivo}`, ''].join('\n')
  ).join('\n');
}

const ENTRIES_OK = [
  ['react', '^19.1.0', 'dependencies', 'UI'],
  ['typescript', '~5.8.3', 'devDependencies', 'compilador TS'],
  ['tauri', '2', 'dependencies', 'runtime Tauri'],
  ['serde_json', '1', 'dependencies', 'serialización JSON'],
  ['tauri-build', '2', 'build-dependencies', 'build script de Tauri'],
  ['pretty_assertions', '1', 'dev-dependencies', 'aserciones legibles'],
];

function conFixtures(registroMd, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'deps-fixture-'));
  try {
    writeFileSync(join(dir, 'package.json'), PKG_OK, 'utf8');
    writeFileSync(join(dir, 'Cargo.toml'), CARGO_OK, 'utf8');
    writeFileSync(join(dir, 'dependencies.md'), registroMd, 'utf8');
    return fn(join(dir, 'package.json'), join(dir, 'dependencies.md'), join(dir, 'Cargo.toml'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('REQ-02-05/10: fixture válido — validateDependencies no devuelve errores', () => {
  const errors = conFixtures(registry(ENTRIES_OK), (pkg, reg, cargo) => validateDependencies(pkg, reg, cargo));
  assert.deepEqual(errors, []);
});

test('REQ-02-10: dependencia npm sin entrada aprobada falla nombrándola', () => {
  const sinReact = registry(ENTRIES_OK.filter(([pkg]) => pkg !== 'react'));
  const errors = conFixtures(sinReact, (pkg, reg, cargo) => validateDependencies(pkg, reg, cargo));
  assert.ok(errors.some((e) => e.includes('"react"')), `debe nombrar a "react": ${JSON.stringify(errors)}`);
});

test('REQ-02-10: crate sin entrada aprobada falla nombrándolo', () => {
  const sinTauriBuild = registry(ENTRIES_OK.filter(([pkg]) => pkg !== 'tauri-build'));
  const errors = conFixtures(sinTauriBuild, (pkg, reg, cargo) => validateDependencies(pkg, reg, cargo));
  assert.ok(errors.some((e) => e.includes('"tauri-build"')), `debe nombrar a "tauri-build": ${JSON.stringify(errors)}`);
});

test('REQ-02-05: versión o scope divergentes entre registro y manifiestos fallan', () => {
  const divergente = registry(ENTRIES_OK
    .map(([pkg, v, s, m]) => pkg === 'typescript' ? [pkg, '~5.9.0', s, m] : [pkg, v, s, m])
    .map(([pkg, v, s, m]) => pkg === 'serde_json' ? [pkg, v, 'dev-dependencies', m] : [pkg, v, s, m]));
  const errors = conFixtures(divergente, (pkg, reg, cargo) => validateDependencies(pkg, reg, cargo));
  assert.ok(errors.some((e) => e.includes('typescript') && e.includes('~5.9.0')), `versión divergente: ${JSON.stringify(errors)}`);
  assert.ok(errors.some((e) => e.includes('serde_json') && e.includes('scope')), `scope divergente: ${JSON.stringify(errors)}`);
});

test('REQ-02-05: parseCargoManifest cubre las tres secciones TOML y ambos formatos', () => {
  const manifest = parseCargoManifest(CARGO_OK);
  assert.equal(manifest.get('tauri')?.version, '2');
  assert.equal(manifest.get('tauri')?.scope, 'dependencies');
  assert.equal(manifest.get('tauri-build')?.version, '2');
  assert.equal(manifest.get('tauri-build')?.scope, 'build-dependencies');
  assert.equal(manifest.get('pretty_assertions')?.version, '1');
  assert.equal(manifest.get('pretty_assertions')?.scope, 'dev-dependencies');
  assert.equal(manifest.get('serde_json')?.version, '1');
  assert.equal(manifest.size, 4, 'no debe colarse nada de [package] ni otras secciones');
});
