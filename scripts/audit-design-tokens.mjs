// Guardián de tokens del arnés (REQ-12-06, feature 12 cleanup-dead-code).
// Recorre las hojas de src/styles y falla (exit ≠ 0) ante cualquier valor de
// color fuera de tokens.css: hex #rrggbb (3-8 dígitos), rgb( o rgba(.
// Uso: node scripts/audit-design-tokens.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STYLES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'styles');
const TOKENS_FILE = 'tokens.css';
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\(/g;

const errores = [];

function* hojas(dir, prefijo = '') {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) yield* hojas(ruta, `${prefijo}${nombre}/`);
    else if (nombre.endsWith('.css')) yield `${prefijo}${nombre}`;
  }
}

for (const hoja of hojas(STYLES_DIR)) {
  if (hoja === TOKENS_FILE) continue;
  const lineas = readFileSync(join(STYLES_DIR, hoja), 'utf8').split(/\r?\n/);
  lineas.forEach((linea, i) => {
    for (const match of linea.matchAll(COLOR_RE)) {
      errores.push(`${hoja}:${i + 1}: color suelto "${match[0]}" (debe salir de tokens.css)`);
    }
  });
}

if (errores.length > 0) {
  for (const error of errores) console.error(`TOKENS ✘ ${error}`);
  process.exit(1);
}

console.log('AUDIT ✔ ningún color fuera de tokens.css en src/styles');