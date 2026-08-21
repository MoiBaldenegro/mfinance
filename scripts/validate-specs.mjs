import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FEATURE_LIST_PATH = fileURLToPath(new URL('../feature_list.json', import.meta.url));
const SPECS_ROOT = fileURLToPath(new URL('../specs/', import.meta.url));

// Prefijo de id: REQ-18-01 <oración EARS>
const REQ_PREFIX = /^REQ-(\d{2})-(\d{2})\s+(.+)$/;
// Patrón EARS completo (ubicuo + WHEN/WHILE/IF-THEN + WHERE opcional al final)
const EARS = /^(?:(?:WHEN\s+[^,]+,|WHILE\s+[^,]+,|IF\s+[^,]+, THEN)\s*)?[^,]+?\s+SHALL\s+.+?(?:,\s*WHERE\s+.+)?$/i;
// Conteo de SHALL (debe dar exactamente 1; SHALL NOT cuenta como un único SHALL)
const SHALL_COUNT = /\bSHALL\b/gi;
// Verbos vagos prohibidos
const VAGUE = /\b(soportar|mejorar|debe ser)\b/i;

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function validateRequirements(text, expectedNn) {
  const errors = [];
  text.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) return;
    const lineNumber = index + 1;
    const prefix = REQ_PREFIX.exec(line);
    if (!prefix) {
      errors.push(`línea ${lineNumber}: falta el prefijo REQ-<NN>-<xx>`);
      return;
    }
    if (prefix[1] !== expectedNn) {
      errors.push(`línea ${lineNumber}: prefijo REQ-${prefix[1]}-${prefix[2]} no coincide con la feature ${expectedNn}`);
      return;
    }
    const sentence = prefix[3];
    if (!EARS.test(sentence)) {
      errors.push(`línea ${lineNumber}: no cumple un patrón EARS válido`);
    }
    const matches = sentence.match(SHALL_COUNT) ?? [];
    if (matches.length !== 1) {
      errors.push(`línea ${lineNumber}: debe contener exactamente un SHALL (encontrados ${matches.length})`);
    }
    if (VAGUE.test(line)) {
      errors.push(`línea ${lineNumber}: contiene un verbo vago prohibido (soportar, mejorar, "debe ser")`);
    }
  });
  return errors;
}

export function validateSpecs({ featureListPath = FEATURE_LIST_PATH, specsRoot = SPECS_ROOT } = {}) {
  const errors = [];
  // Guard de la feature 16 (REQ-16-03): sin este check, check-format.mjs
  // crashearía con ENOENT cuando feature_list.json no existe.
  if (!existsSync(featureListPath)) {
    errors.push('feature_list.json no existe: se omite la validación de specs');
    return errors;
  }
  const data = JSON.parse(readFileSync(featureListPath, 'utf8'));
  const features = Array.isArray(data.features) ? data.features : [];
  for (const feature of features) {
    if (typeof feature.id !== 'number' || feature.status === 'done') continue;
    const nn = String(feature.id).padStart(2, '0');
    const slug = typeof feature.name === 'string' ? slugify(feature.name) : 'unknown';
    const specDir = join(specsRoot, `${nn}_${slug}`);
    const relative = `specs/${nn}_${slug}`;
    if (!existsSync(join(specDir, 'requirements.md'))) {
      errors.push(`feature ${feature.id} ${feature.name}: falta ${relative}/requirements.md`);
      continue;
    }
    const text = readFileSync(join(specDir, 'requirements.md'), 'utf8');
    for (const error of validateRequirements(text, nn)) {
      errors.push(`${relative}/requirements.md:${error}`);
    }
    const designPath = join(specDir, 'design.md');
    if (existsSync(designPath) && statSync(designPath).size === 0) {
      errors.push(`${relative}/design.md: el archivo está vacío`);
    }
  }
  return errors;
}