// Suite F12 (frontend): caso de uso puro de la tabla revisable
// (REQ-12-10/11). El journey con adapter fake vive en
// diagnostico-tabla-acciones.test.mjs; invoke() solo bajo src/adapters/.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  crearFilas,
  validarCambios,
} from '../../src/domain/use-cases/diagnostico-tabla.ts';
import { INFORME } from './diagnostico-informe.mjs';

describe('crearFilas (REQ-12-10)', () => {
  it('crea filas pendientes solo de los movimientos analizados', () => {
    const filas = crearFilas(INFORME);
    assert.equal(filas.length, 3);
    for (const fila of filas) {
      assert.equal(fila.estado, 'pendiente');
      assert.equal(fila.categoria, null);
      assert.equal(fila.archivo, 'extracto.pdf');
    }
  });

  it('los ids son únicos por archivo e índice', () => {
    const ids = crearFilas(INFORME).map((fila) => fila.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe('validarCambios (REQ-12-11)', () => {
  it('acepta una edición completa válida', () => {
    assert.deepEqual(
      validarCambios({ fecha: '2026-06-02', importe: -50, comercio: 'TIENDA' }),
      [],
    );
  });

  it('rechaza fecha mal formada e importe no numérico', () => {
    const errores = validarCambios({ fecha: '1-junio', importe: NaN });
    assert.equal(errores.length, 2);
    assert.match(errores[0], /AAAA-MM-DD/);
    assert.match(errores[1], /número válido/);
  });

  it('rechaza concepto vacío', () => {
    assert.ok(validarCambios({ comercio: '   ' }).length > 0);
  });
});
