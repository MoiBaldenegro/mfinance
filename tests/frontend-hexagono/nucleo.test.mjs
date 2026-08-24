// Suite F5 hexágono (1/2): pureza del dominio (REQ-05-01) e invocación
// IPC restringida al adapter (REQ-05-02), verificadas sobre el árbol real.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SEP, SRC, archivosTs, relativa } from './utils.mjs';

const todosLosArchivos = archivosTs(SRC);

describe('REQ-05-01: src/domain puro', () => {
  const nucleo = [
    'entities/catalogs.ts',
    'entities/month-key.ts',
    'entities/finance-snapshot.ts',
    'errors/snapshot-errors.ts',
    'ports/snapshot-port.ts',
    'use-cases/load-snapshot.ts',
    'use-cases/resumenes-secciones.ts',
  ];

  it('existe la base de entidades puertos errores y casos de uso', () => {
    const faltantes = nucleo.filter(
      (relativo) => !existsSync(join(SRC, 'domain', relativo)),
    );
    assert.deepEqual(faltantes, []);
  });

  it('no importa react ni @tauri-apps ni llama invoke', () => {
    const infracciones = [];
    for (const ruta of todosLosArchivos) {
      if (!ruta.includes(`${SEP}domain${SEP}`)) continue;
      const contenido = readFileSync(ruta, 'utf8');
      if (/from\s+["']react|@tauri-apps|invoke\s*\(/.test(contenido)) {
        infracciones.push(relativa(ruta));
      }
    }
    assert.deepEqual(infracciones, []);
  });
});

describe('REQ-05-02: invoke() solo bajo src/adapters/', () => {
  it('ningún archivo fuera de adapters usa invoke(', () => {
    const infracciones = [];
    for (const ruta of todosLosArchivos) {
      if (ruta.includes(`${SEP}adapters${SEP}`)) continue;
      if (/invoke\s*\(/.test(readFileSync(ruta, 'utf8'))) {
        infracciones.push(relativa(ruta));
      }
    }
    assert.deepEqual(infracciones, []);
  });

  it('existe el adapter IPC del snapshot con las 4 operaciones', () => {
    const adapter = readFileSync(join(SRC, 'adapters', 'snapshot-ipc-adapter.ts'), 'utf8');
    assert.match(adapter, /invoke/);
    for (const comando of ['load_state', 'save_state', 'export_json', 'import_json']) {
      assert.ok(adapter.includes(`'${comando}'`), `falta ${comando}`);
    }
  });
});
