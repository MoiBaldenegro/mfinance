// Reglas hexagonales del frontend verificadas sobre los imports reales.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../../src', import.meta.url));
const archivos = (dir) => readdirSync(dir).flatMap((n) => {
  const ruta = join(dir, n);
  return statSync(ruta).isDirectory() ? archivos(ruta) : /\.(ts|tsx)$/.test(n) ? [ruta] : [];
});
const imports = (ruta) => [...readFileSync(ruta, 'utf8').matchAll(/^import [^;]*?from ['"]([^'"]+)['"]/gm)].map((m) => m[1]);
const rel = (ruta) => relative(SRC, ruta).split(sep).join('/');

test('solo el composition root y el arranque importan adaptadores concretos', () => {
  const permitidos = new Set(['app/composicion.ts', 'main.tsx']);
  const infractores = archivos(SRC)
    .filter((r) => !rel(r).startsWith('adapters/') && !permitidos.has(rel(r)))
    .filter((r) => imports(r).some((i) => i.includes('/adapters/')))
    .map(rel);
  assert.deepEqual(infractores, []);
});

test('@tauri-apps/api solo se usa dentro de src/adapters', () => {
  const infractores = archivos(SRC)
    .filter((r) => !rel(r).startsWith('adapters/'))
    .filter((r) => imports(r).some((i) => i.startsWith('@tauri-apps/')))
    .map(rel);
  assert.deepEqual(infractores, []);
});

test('el dominio no depende de React, Tauri, adaptadores ni UI', () => {
  const infractores = archivos(join(SRC, 'domain'))
    .filter((r) => imports(r).some((i) => /^react|^@tauri-apps|\/adapters\/|\/components\/|\/hooks\/|\/app\//.test(i)))
    .map(rel);
  assert.deepEqual(infractores, []);
});
