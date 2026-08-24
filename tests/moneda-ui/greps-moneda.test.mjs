// Suite F20 (REQ-20-04): barridos estructurales permanentes del arnés.
// El símbolo y los separadores provienen SOLO del catálogo de monedas:
// 0 ocurrencias de "es-ES" bajo src/domain/use-cases y 0 de "€" bajo
// src/components. Escrito ANTES de la migración (rojo) para evidenciar
// los literales heredados y verificar en verde tras ella.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const RAIZ = join(import.meta.dirname, '..', '..');

/** Recorre el árbol y devuelve las rutas de archivos con la extensión dada. */
function archivos(directorio, extensiones, acumulado = []) {
  for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) {
      archivos(ruta, extensiones, acumulado);
    } else if (extensiones.some((ext) => entrada.name.endsWith(ext))) {
      acumulado.push(ruta);
    }
  }
  return acumulado;
}

function ofensores(directorio, extensiones, aguja) {
  return archivos(join(RAIZ, directorio), extensiones)
    .filter((ruta) => readFileSync(ruta, 'utf8').includes(aguja))
    .map((ruta) => ruta.slice(RAIZ.length + 1));
}

describe('barrido estructural: sin literales de formato heredados (REQ-20-04)', () => {
  it('src/domain/use-cases no contiene "es-ES"', () => {
    assert.deepEqual(
      ofensores('src/domain/use-cases', ['.ts'], 'es-ES'),
      [],
    );
  });

  it('src/components no contiene el símbolo "€"', () => {
    assert.deepEqual(
      ofensores('src/components', ['.tsx', '.ts', '.css'], '€'),
      [],
    );
  });
});
