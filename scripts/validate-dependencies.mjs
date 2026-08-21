// scripts/validate-dependencies.mjs — Valida docs/dependencies.md contra
// package.json (REQ-29-01..03, feature 29 dependencies-registry).
// Formato del registro: bloques "### package" seguidos de "- clave: valor"
// (claves: version, scope, approved, motivo). Node stdlib, <=100 líneas.

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PACKAGE_PATH = fileURLToPath(new URL('../package.json', import.meta.url));
const REGISTRY_PATH = fileURLToPath(new URL('../docs/dependencies.md', import.meta.url));

const REQUIRED_FIELDS = ['version', 'scope', 'approved', 'motivo'];

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

export function validateDependencies(packagePath = PACKAGE_PATH, registryPath = REGISTRY_PATH) {
  const errors = [];
  if (!existsSync(registryPath)) {
    errors.push('docs/dependencies.md: el registro de dependencias aprobadas no existe');
    return errors;
  }
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const entries = parseRegistry(readFileSync(registryPath, 'utf8'));

  for (const scope of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(pkg[scope] ?? {})) {
      const entry = entries.get(name);
      if (entry === undefined) {
        errors.push(`docs/dependencies.md: la dependencia "${name}" (${scope}) no está aprobada en el registro`);
        continue;
      }
      if (entry.fields.version !== version) {
        errors.push(`docs/dependencies.md: "${name}" declara version "${entry.fields.version}", package.json tiene "${version}"`);
      }
      if (entry.fields.scope !== scope) {
        errors.push(`docs/dependencies.md: "${name}" declara scope "${entry.fields.scope}", package.json la tiene en "${scope}"`);
      }
    }
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
