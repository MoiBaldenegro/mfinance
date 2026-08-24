// Suite feature 16 (5/5): bloqueo de meses cerrados (REQ-16-07): el
// registro mensual de un mes cerrado es solo lectura hasta reabrirlo.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  mesEstaCerrado,
  avisoMesCerrado,
} from '../../src/domain/use-cases/mes-cerrado.ts';
import { snapshotDePrueba } from './helpers.mjs';

function snapshotConCierre(mes) {
  const snapshot = snapshotDePrueba();
  return {
    ...snapshot,
    assessments: [
      { mes, fecha_cierre: '2026-08-01', indicadores: [], presupuesto_siguiente: {} },
    ],
  };
}

describe('mes cerrado solo lectura (REQ-16-07)', () => {
  it('detecta el mes con assessment persistido como cerrado', () => {
    assert.equal(mesEstaCerrado(snapshotConCierre('2026-08'), '2026-08'), true);
  });

  it('los meses sin cierre siguen siendo editables', () => {
    const snapshot = snapshotConCierre('2026-07');
    assert.equal(mesEstaCerrado(snapshot, '2026-08'), false);
    assert.equal(mesEstaCerrado(snapshotDePrueba(), '2026-08'), false);
  });

  it('el aviso explica que está cerrado y cómo reabrirlo', () => {
    const aviso = avisoMesCerrado('2026-08');
    assert.ok(aviso.includes('cerrado'));
    assert.ok(aviso.includes('Reabrir') || aviso.includes('reabrir'));
  });
});
