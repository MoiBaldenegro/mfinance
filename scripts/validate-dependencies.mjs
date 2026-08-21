// scripts/validate-dependencies.mjs — Valida docs/dependencies.md contra
// package.json y src-tauri/Cargo.toml (feature 2 harness-tooling-tauri).
// Formato del registro: bloques "### package" seguidos de "- clave: valor"
// (claves: version, scope, approved, motivo). Node stdlib, <=100 líneas.

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PACKAGE_PATH = fileURLToPath(new URL('../package.json', import.meta.url));
const REGISTRY_PATH = fileURLToPath(new URL('../docs/dependencies.md', import.meta.url));
const CARGO_PATH = fileURLToPath(new URL('../src-tauri/Cargo.toml', import.meta.url));

const REQUIRED_FIELDS = ['version', 'scope', 'approved', 'motivo'];
const CRATE_SECTIONS = new Set(['dependencies', 'build-dependencies', 'dev-dependencies']);

// Parsea el registro en un Map package -> { package, fields }.
export function parseRegistry(content) {
  const entries = new Map();
  let current = null;
  for (const line of content.split('\n')) {
    const header = line.match(/^###\s+(.+)$/);
    if (header !== null) {
      current = { package: header[1].trim(), fields: {} };
      entries.set(current.package, current);
      continue;
    }
    if (current === null) continue;
    const field = line.match(/^-\s*([a-z]+)\s*:\s*(.+)$/);
    if (field !== null) current.fields[field[1]] = field[2].trim();
  }
  return entries;
}

// Parser TOML mínimo por líneas: extrae crate -> { version, scope } de las
// secciones [dependencies], [build-dependencies] y [dev-dependencies].
// Formatos soportados: `crate = "versión"` y
// `crate = { version = "versión", features = [...] }`.
export function parseCargoManifest(content) {
  const manifest = new Map();
  let section = '';
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    const heading = line.match(/^\[([^\]]+)\]$/);
    if (heading !== null) {
      section = CRATE_SECTIONS.has(heading[1]) ? heading[1] : '';
      continue;
    }
    if (section === '' || line === '' || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(?:"([^"]+)"|\{\s*version\s*=\s*"([^"]+)")/);
    if (m !== null) manifest.set(m[1], { version: m[2] ?? m[3], scope: section });
  }
  return manifest;
}

function checkEntry(errors, entries, name, dep, kind, manifestName) {
  const entry = entries.get(name);
  if (entry === undefined) {
    errors.push(`docs/dependencies.md: ${kind} "${name}" (${dep.scope}) no está aprobado en el registro`);
    return;
  }
  if (entry.fields.version !== dep.version) {
    errors.push(`docs/dependencies.md: "${name}" declara version "${entry.fields.version}", ${manifestName} tiene "${dep.version}"`);
  }
  if (entry.fields.scope !== dep.scope) {
    errors.push(`docs/dependencies.md: "${name}" declara scope "${entry.fields.scope}", ${manifestName} lo tiene en "${dep.scope}"`);
  }
}

// Valida el registro contra package.json y Cargo.toml. Sin argumentos usa las
// rutas reales del repo (compatibilidad con scripts/check-format.mjs).
export function validateDependencies(packagePath = PACKAGE_PATH, registryPath = REGISTRY_PATH, cargoPath = CARGO_PATH) {
  const errors = [];
  if (!existsSync(registryPath)) {
    errors.push('docs/dependencies.md: el registro de dependencias aprobadas no existe');
    return errors;
  }
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const cargo = readFileSync(cargoPath, 'utf8');
  const entries = parseRegistry(readFileSync(registryPath, 'utf8'));

  for (const scope of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(pkg[scope] ?? {})) {
      checkEntry(errors, entries, name, { version, scope }, 'la dependencia', 'package.json');
    }
  }

  for (const [name, dep] of parseCargoManifest(cargo)) {
    checkEntry(errors, entries, name, dep, 'el crate', 'Cargo.toml');
  }

  for (const entry of entries.values()) {
    for (const field of REQUIRED_FIELDS) {
      if (entry.fields[field] === undefined) {
        errors.push(`docs/dependencies.md: la entrada "${entry.package}" no declara "${field}"`);
      }
    }
  }

  return errors;
}
