// Suite feature 16 (4/5): histórico de cierres consultable (REQ-16-08)
// desde los assessments persistidos en el snapshot.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resumenesHistorico } from '../../src/domain/use-cases/cierre-historico.ts';
import { snapshotDePrueba } from './helpers.mjs';

function snapshotConCierres() {
  const snapshot = snapshotDePrueba();
  return {
    ...snapshot,
    assessments: [
      {
        mes: '2026-07',
        fecha_cierre: '2026-08-01',
        indicadores: [
          { nombre: 'Endeudamiento', valor: 10.4, clasificacion: 'verde' },
        ],
        presupuesto_siguiente: { Vivienda: 950, Ocio: 150 },
      },
      {
        mes: '2026-06',
        fecha_cierre: '2026-07-01',
        indicadores: [],
        presupuesto_siguiente: { Vivienda: 900 },
      },
    ],
  };
}

describe('histórico de cierres (REQ-16-08)', () => {
  it('lista los meses cerrados del más reciente al más antiguo', () => {
    const historico = resumenesHistorico(snapshotConCierres());
    assert.deepEqual(
      historico.map((fila) => fila.mes),
      ['2026-07', '2026-06'],
    );
    assert.equal(historico[0].fecha, '2026-08-01');
  });

  it('resume el total presupuestado para el mes siguiente', () => {
    const historico = resumenesHistorico(snapshotConCierres());
    assert.ok(Math.abs(historico[0].totalPresupuesto - 1100) < 1e-9);
    assert.ok(Math.abs(historico[1].totalPresupuesto - 900) < 1e-9);
  });

  it('sin cierres devuelve una lista vacía sin romperse', () => {
    assert.deepEqual(resumenesHistorico(snapshotDePrueba()), []);
  });
});
