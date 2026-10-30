// Integridad del sistema de diseño: protege contra los bugs visuales
// encontrados en la auditoría (tokens inexistentes que caen al valor por
// defecto del navegador y bloques CSS compartidos entre componentes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

function archivos(dir, extension) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta, extension);
    return ruta.endsWith(extension) ? [ruta] : [];
  });
}

const hojas = archivos(SRC, '.css');
const tokens = readFileSync(join(SRC, 'styles', 'tokens.css'), 'utf8');
const definidos = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

test('toda custom property usada está definida en tokens.css', () => {
  const faltan = [];
  for (const hoja of hojas) {
    const css = readFileSync(hoja, 'utf8');
    const locales = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    for (const [, nombre] of css.matchAll(/var\((--[\w-]+)\)/g)) {
      if (!definidos.has(nombre) && !locales.has(nombre)) faltan.push(`${relative(SRC, hoja)}: ${nombre}`);
    }
  }
  assert.deepEqual([...new Set(faltan)], []);
});

test('ambos temas definen la misma paleta de color', () => {
  const [oscuro, claro] = tokens.split("[data-theme='claro']");
  const colores = (bloque) => new Set([...bloque.matchAll(/(--(?:color|chart|shadow|sombra)[\w-]*)\s*:/g)].map((m) => m[1]));
  const enClaro = colores(claro.split(':root, [data-theme')[0]);
  const soloOscuro = [...colores(oscuro)].filter((n) => !enClaro.has(n));
  assert.deepEqual(soloOscuro, []);
});

test('ningún bloque CSS se comparte entre carpetas de componentes distintas', () => {
  const usos = new Map();
  for (const tsx of archivos(join(SRC, 'components'), '.tsx')) {
    const carpeta = relative(join(SRC, 'components'), tsx).split(sep)[0];
    const codigo = readFileSync(tsx, 'utf8');
    for (const [, bloque] of codigo.matchAll(/className=\{?["'`]([a-z][\w-]*?)(?:__|--|["'`\s}])/g)) {
      if (!usos.has(bloque)) usos.set(bloque, new Set());
      usos.get(bloque).add(carpeta);
    }
  }
  const primitivas = /^(pagina|card|rejilla|btn|campo|segmentado|badge|aviso|tabla|kpi|estado-vacio|estado-carga|grafica|tabla-contenedor|tabla-mes|separador|texto-muted|texto-sm|num|positivo|negativo|solo-lectores|marca|pestanas)$/;
  const compartidos = [...usos]
    .filter(([bloque, carpetas]) => carpetas.size > 1 && !primitivas.test(bloque))
    .map(([bloque, carpetas]) => `${bloque}: ${[...carpetas].join(', ')}`);
  assert.deepEqual(compartidos, []);
});

test('no hay hojas CSS fuera de src/styles', () => {
  const fuera = hojas.filter((h) => !relative(SRC, h).startsWith(`styles${sep}`));
  assert.deepEqual(fuera.map((h) => relative(SRC, h)), []);
});
