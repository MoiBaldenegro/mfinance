// Suite F5 (1/3): array declarativo de secciones (REQ-05-04) y catálogos
// espejo del dominio Rust serializado, con claves canónicas alineadas.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SECCIONES } from '../../src/components/shell/secciones.ts';
import {
  CANONICAL_EXPENSE_KEYS,
  CANONICAL_INCOME_KEYS,
  DEBT_STRATEGIES,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  INCOME_SOURCES,
  INCOME_SOURCE_LABELS,
  INVESTMENT_FAMILIES,
} from '../../src/domain/entities/catalogs.ts';
import { TITULOS_REQ_05_04 } from './helpers.mjs';

describe('secciones del shell (REQ-05-04)', () => {
  it('declara exactamente las diez secciones del requerimiento en orden', () => {
    assert.equal(SECCIONES.length, 10);
    assert.deepEqual([...SECCIONES.map((s) => s.titulo)], TITULOS_REQ_05_04);
  });

  it('usa ids únicos en kebab-case', () => {
    const ids = SECCIONES.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^[a-z]+$/);
  });
});

describe('catálogos espejo del dominio Rust serializado', () => {
  it('fuentes de ingreso con valores de cable serde y claves canónicas alineadas', () => {
    assert.deepEqual([...INCOME_SOURCES], ['Salario', 'Freelance', 'Arriendos', 'Otros']);
    assert.deepEqual(
      [...CANONICAL_INCOME_KEYS],
      ['salario', 'freelance', 'arriendos', 'otros'],
    );
  });

  it('categorías de gasto con valores de cable serde y claves canónicas alineadas', () => {
    assert.deepEqual(
      [...EXPENSE_CATEGORIES],
      ['Vivienda', 'Alimentacion', 'Transporte', 'CuotasDeuda', 'Ocio', 'Otros'],
    );
    assert.deepEqual(
      [...CANONICAL_EXPENSE_KEYS],
      ['vivienda', 'alimentacion', 'transporte', 'cuotas_deuda', 'ocio', 'otros'],
    );
  });

  it('familias de inversión y estrategias de deuda exactas', () => {
    assert.deepEqual([...INVESTMENT_FAMILIES], ['RentaFija', 'RentaVariable', 'FincaRaiz']);
    assert.deepEqual([...DEBT_STRATEGIES], ['Avalanche', 'Snowball']);
  });

  it('etiquetas en español completas para ingresos y gastos', () => {
    for (const fuente of INCOME_SOURCES) {
      assert.equal(typeof INCOME_SOURCE_LABELS[fuente], 'string');
      assert.ok(INCOME_SOURCE_LABELS[fuente].length > 0);
    }
    for (const categoria of EXPENSE_CATEGORIES) {
      assert.ok(EXPENSE_CATEGORY_LABELS[categoria].length > 0);
    }
    assert.equal(EXPENSE_CATEGORY_LABELS.CuotasDeuda, 'Cuotas de deuda');
  });
});
