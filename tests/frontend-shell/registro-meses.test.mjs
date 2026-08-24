// Suite F6 (5/5): navegación de meses del selector ‹ › (REQ-06-01) y
// mes inicial por defecto al abrir la sección Registro.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { InvalidMonthKeyError } from '../../src/domain/entities/month-key.ts';
import {
  mesActualDesde,
  mesAnterior,
  mesSiguiente,
} from '../../src/domain/use-cases/navegacion-meses.ts';

describe('selector de mes: botones anterior y siguiente (REQ-06-01)', () => {
  it('avanza dentro del mismo año', () => {
    assert.equal(mesSiguiente('2026-08'), '2026-09');
  });

  it('avanza cruzando el cambio de año', () => {
    assert.equal(mesSiguiente('2026-12'), '2027-01');
  });

  it('retrocede dentro del mismo año', () => {
    assert.equal(mesAnterior('2026-08'), '2026-07');
  });

  it('retrocede cruzando el cambio de año', () => {
    assert.equal(mesAnterior('2026-01'), '2025-12');
  });

  it('anterior y siguiente se anulan en ida y vuelta', () => {
    assert.equal(mesAnterior(mesSiguiente('1999-12')), '1999-12');
  });

  it('una clave inválida lanza InvalidMonthKeyError nombrado', () => {
    assert.throws(() => mesSiguiente('agosto'), InvalidMonthKeyError);
    assert.throws(() => mesAnterior('2026-13'), InvalidMonthKeyError);
  });
});

describe('mes inicial del formulario (mes de trabajo o actual)', () => {
  it('mesActualDesde deriva YYYY-MM de una fecha local fija', () => {
    assert.equal(mesActualDesde(new Date(2026, 7, 21)), '2026-08');
    assert.equal(mesActualDesde(new Date(2027, 0, 2)), '2027-01');
    assert.equal(mesActualDesde(new Date(2025, 11, 31)), '2025-12');
  });
});
