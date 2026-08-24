// Suite F17 tema-oscuro-tokens (2/2): integración de la UI con el tema:
// data-theme pre-render (REQ-17-08), puerto TemaPort + adapter localStorage
// (REQ-17-07), pureza del dominio, redibujado de gráficas (REQ-17-06),
// conmutador en Ajustes (REQ-17-02) y cero colores hardcodeados.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const relativaDe = (ruta) => ruta.slice(SRC.length + 1).replaceAll('\\', '/');

function archivosTs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory()
    ? archivosTs(join(dir, e.name))
    : (/\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : []));
}

function leer(relativa) {
  return readFileSync(join(SRC, ...relativa.split('/')), 'utf8');
}

describe('REQ-17-08: data-theme fijado antes del primer render', () => {
  it('main.tsx aplica data-theme sobre <html> ANTES de .render(', () => {
    const main = leer('main.tsx');
    const idxRender = main.indexOf('.render(');
    const idxTema = main.search(/iniciarTema\s*\(|data-theme/);
    assert.ok(idxRender !== -1 && idxTema !== -1 && idxTema < idxRender,
      'data-theme debe fijarse sobre <html> ANTES del primer render');
  });
});

describe('REQ-17-07: puerto TemaPort + adapter localStorage', () => {
  it('el puerto existe en src/domain/ports con leer/guardar', () => {
    const ruta = 'domain/ports/tema-port.ts';
    assert.ok(existsSync(join(SRC, ...ruta.split('/'))), `falta src/${ruta}`);
    const puerto = leer(ruta);
    assert.ok(/interface TemaPort/.test(puerto) && /leer\s*\(/.test(puerto)
      && /guardar\s*\(/.test(puerto), 'falta TemaPort con leer()/guardar()');
  });
  it('un adapter bajo src/adapters lo implementa vía localStorage', () => {
    const adapter = leer('adapters/tema-local-storage-adapter.ts');
    assert.match(adapter, /implements TemaPort/);
    assert.match(adapter, /localStorage/);
  });
  it('ningún componente bajo src/components toca localStorage', () => {
    const infracciones = [];
    for (const ruta of archivosTs(join(SRC, 'components'))) {
      if (/localStorage/.test(readFileSync(ruta, 'utf8'))) infracciones.push(relativaDe(ruta));
    }
    assert.deepEqual(infracciones, []);
  });
  it('los módulos de tema del dominio permanecen puros', () => {
    for (const relativo of ['domain/entities/tema.ts', 'domain/ports/tema-port.ts',
      'domain/use-cases/resolver-tema.ts']) {
      assert.doesNotMatch(leer(relativo),
        /from\s+["']react|@tauri-apps|invoke\s*\(|localStorage/, `${relativo} no es puro`);
    }
  });
});

describe('REQ-17-06: gráficas redibujadas al cambiar de tema', () => {
  const GRAFICAS = [
    'pyg-section/PygChart.tsx', 'deuda-section/DeudaChart.tsx',
    'balance-section/BalanceChart.tsx', 'pyg-proyeccion-section/ProyeccionChart.tsx',
    'inversiones-section/GraficaProyeccion.tsx', 'pyg-proyeccion-section/BalanceFuturoChart.tsx',
  ];
  it('cada gráfica consume usarTema, chart-colores y depende de tema', () => {
    const problemas = [];
    for (const ruta of GRAFICAS) {
      const contenido = leer(`components/${ruta}`);
      const depsOk = /}\s*,\s*\[[^\]]*\btema\b[^\]]*\]\s*\)\s*;/.test(contenido);
      const baseOk = contenido.includes('usarTema') && contenido.includes('chart-colores');
      if (!baseOk || !depsOk) problemas.push(`${ruta}: falta usarTema/colores/deps de tema`);
    }
    assert.deepEqual(problemas, []);
  });
  it("GraficaProyeccion ya no pasa literales 'var(--chart' a Chart.js", () => {
    const grafica = leer('components/inversiones-section/GraficaProyeccion.tsx');
    assert.ok(!grafica.includes("'var(--chart"), 'pasa var(--chart que el canvas no resuelve');
    assert.match(grafica, /chart-colores/, 'debe consumir src/lib/chart-colores.ts');
  });
});
describe('REQ-17-02 y cero colores hardcodeados en la UI', () => {
  it('AjustesSection alterna el tema con control accesible en español', () => {
    const ajustes = leer('components/ajustes-section/AjustesSection.tsx');
    assert.match(ajustes, /usarTema/, 'no lee el tema activo');
    assert.match(ajustes, /conmutarTema/, 'no alterna el tema');
    assert.match(ajustes, /aria-label="[^"]*tema/i, 'control sin rótulo accesible');
  });
  it('ni hex rgb rgba literales ni siquiera mencionados en components', () => {
    const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\(|\b(hex|rgb|rgba)\b/i;
    const infracciones = [];
    for (const ruta of archivosTs(join(SRC, 'components'))) {
      if (COLOR_RE.test(readFileSync(ruta, 'utf8'))) infracciones.push(relativaDe(ruta));
    }
    assert.deepEqual(infracciones, []);
  });
});
