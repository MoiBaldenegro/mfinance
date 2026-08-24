// Suite F6 (3/5): upsert del registro mensual dentro del snapshot
// (REQ-06-04): crea si falta, actualiza si existe y valida invariantes.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { InvalidMonthKeyError } from '../../src/domain/entities/month-key.ts';
import { ImporteNegativoError } from '../../src/domain/errors/importe-errors.ts';
import {
  buscarRegistroMes,
  upsertRegistroMes,
} from '../../src/domain/use-cases/upsert-registro.ts';
import { snapshotDePrueba } from './helpers.mjs';

describe('upsertRegistroMes sobre el snapshot (REQ-06-04)', () => {
  it('crea el registro cuando el mes no existe aún', () => {
    const snapshot = snapshotDePrueba();
    const nuevo = upsertRegistroMes(snapshot, {
      mes: '2026-09',
      ingresos: { Salario: 2600 },
      gastos: {},
    });
    assert.equal(nuevo.monthly_records.length, snapshot.monthly_records.length + 1);
    assert.ok(nuevo.monthly_records.some((r) => r.mes === '2026-09'));
  });

  it('actualiza el registro existente sin duplicar el mes', () => {
    const nuevo = upsertRegistroMes(snapshotDePrueba(), {
      mes: '2026-08',
      ingresos: { Salario: 999 },
      gastos: { Ocio: 10 },
    });
    const agosto = nuevo.monthly_records.filter((r) => r.mes === '2026-08');
    assert.equal(agosto.length, 1);
    assert.deepEqual(agosto[0].ingresos, { Salario: 999 });
    assert.deepEqual(agosto[0].gastos, { Ocio: 10 });
  });

  it('no toca los demás meses ni el resto del snapshot', () => {
    const snapshot = snapshotDePrueba();
    const nuevo = upsertRegistroMes(snapshot, {
      mes: '2026-08',
      ingresos: {},
      gastos: {},
    });
    assert.deepEqual(nuevo.assets, snapshot.assets);
    const julio = nuevo.monthly_records.find((r) => r.mes === '2026-07');
    assert.equal(julio.ingresos.Salario, 2000);
  });

  it('mantiene la serie ordenada por mes ascendente', () => {
    const nuevo = upsertRegistroMes(snapshotDePrueba(), {
      mes: '2026-06',
      ingresos: {},
      gastos: {},
    });
    const meses = nuevo.monthly_records.map((r) => r.mes);
    assert.deepEqual([...meses].sort(), meses);
    assert.equal(meses[0], '2026-06');
  });

  it('rechaza importes negativos dentro del registro con error nombrado', () => {
    assert.throws(
      () => upsertRegistroMes(snapshotDePrueba(), {
        mes: '2026-09',
        ingresos: { Salario: -1 },
        gastos: {},
      }),
      ImporteNegativoError,
    );
  });

  it('rechaza un mes fuera de formato con InvalidMonthKeyError', () => {
    for (const mal of ['2026-13', 'agosto', '202608']) {
      assert.throws(
        () => upsertRegistroMes(snapshotDePrueba(), { mes: mal, ingresos: {}, gastos: {} }),
        InvalidMonthKeyError,
      );
    }
  });
});

describe('buscarRegistroMes localiza el registro del mes elegido', () => {
  it('devuelve el registro si existe', () => {
    const julio = buscarRegistroMes(snapshotDePrueba(), '2026-07');
    assert.equal(julio.ingresos.Salario, 2000);
  });

  it('devuelve undefined en un mes sin registro (abrirá a ceros)', () => {
    assert.equal(buscarRegistroMes(snapshotDePrueba(), '2026-12'), undefined);
  });
});
