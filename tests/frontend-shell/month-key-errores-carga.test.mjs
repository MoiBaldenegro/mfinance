// Suite F5 (2/3): clave de mes YYYY-MM, errores nombrados en español y
// caso de uso de carga inicial (REQ-05-03/07) con puerto falso.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  InvalidMonthKeyError,
  parseMonthKey,
} from '../../src/domain/entities/month-key.ts';
import {
  SnapshotLoadError,
  SnapshotSaveError,
} from '../../src/domain/errors/snapshot-errors.ts';
import { cargarSnapshot } from '../../src/domain/use-cases/load-snapshot.ts';
import { puertoFalso, snapshotDePrueba } from './helpers.mjs';

describe('clave de mes YYYY-MM espejo de MonthKey', () => {
  it('acepta meses válidos devolviendo la clave', () => {
    assert.equal(parseMonthKey('2026-08'), '2026-08');
    assert.equal(parseMonthKey('2025-01'), '2025-01');
    assert.equal(parseMonthKey('1999-12'), '1999-12');
  });

  it('rechaza inválidos con error nombrado y mensaje español', () => {
    for (const crudo of ['2026-13', '2026-0', '26-08', '2026/08', 'abcd-ef', '']) {
      assert.throws(() => parseMonthKey(crudo), InvalidMonthKeyError);
    }
    assert.throws(() => parseMonthKey('2026-13'), /YYYY-MM/);
  });
});

describe('errores nombrados del snapshot en español', () => {
  it('SnapshotLoadError conserva nombre y motivo legible', () => {
    const error = new SnapshotLoadError('archivo corrupto');
    assert.equal(error.name, 'SnapshotLoadError');
    assert.ok(error.message.includes('no se pudo cargar el snapshot'));
    assert.ok(error.message.includes('archivo corrupto'));
  });

  it('SnapshotSaveError es un error nombrado distinto', () => {
    const error = new SnapshotSaveError('sin permisos');
    assert.notEqual(error.name, new SnapshotLoadError('x').name);
    assert.ok(error.message.includes('no se pudo guardar el snapshot'));
  });
});

describe('caso de uso de carga inicial (REQ-05-03/07)', () => {
  it('expone el snapshot cargado cuando el puerto responde', async () => {
    const snapshot = snapshotDePrueba();
    let llamadas = 0;
    const resultado = await cargarSnapshot(
      puertoFalso(async () => {
        llamadas += 1;
        return snapshot;
      }),
    );
    assert.equal(llamadas, 1);
    assert.equal(resultado.ok, true);
    if (resultado.ok) assert.strictEqual(resultado.snapshot, snapshot);
  });

  it('convierte el rechazo nombrado del IPC en SnapshotLoadError en español', async () => {
    const rechazo = {
      codigo: 'SnapshotLoadError',
      mensaje: 'no se pudo cargar el snapshot: JSON malformado',
    };
    const resultado = await cargarSnapshot(puertoFalso(async () => Promise.reject(rechazo)));
    assert.equal(resultado.ok, false);
    if (!resultado.ok) {
      assert.ok(resultado.error instanceof SnapshotLoadError);
      assert.ok(resultado.error.message.includes('JSON malformado'));
    }
  });

  it('envuelve fallos inesperados en SnapshotLoadError sin perder el motivo', async () => {
    const resultado = await cargarSnapshot(
      puertoFalso(async () => {
        throw new Error('boom interno');
      }),
    );
    assert.equal(resultado.ok, false);
    if (!resultado.ok) {
      assert.ok(resultado.error instanceof SnapshotLoadError);
      assert.ok(resultado.error.message.includes('boom interno'));
    }
  });
});
