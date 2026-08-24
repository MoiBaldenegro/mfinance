// Utilidades compartidas de las suites frontend-hexagono (feature 5):
// recorrido del árbol src/ y rutas relativas. Sin aserciones; este
// archivo no es descubierto por node --test (no casa con *.test.mjs).
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Raíz del repositorio (directorio padre de tests/). */
export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Directorio de código del frontend. */
export const SRC = join(RAIZ, 'src');

/** Separador de rutas nativo (para detectar pertenencia a una carpeta). */
export const SEP = process.platform === 'win32' ? '\\' : '/';

/** Lista recursiva de archivos .ts/.tsx bajo `dir`. */
export function archivosTs(dir) {
  const salida = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...archivosTs(ruta));
    else if (/\.(ts|tsx)$/.test(entrada.name)) salida.push(ruta);
  }
  return salida;
}

/** Ruta relativa al repo con separadores normalizados (para mensajes). */
export function relativa(ruta) {
  return ruta.slice(RAIZ.length + 1).replaceAll('\\', '/');
}
