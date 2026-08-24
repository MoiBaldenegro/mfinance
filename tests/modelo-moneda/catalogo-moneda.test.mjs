// Suite F19 (2/2): entidad-catálogo Moneda espejo del enum Rust y
// currency en StrategySettings con AJUSTES_POR_DEFECTO en MXN
// (REQ-19-01 y REQ-19-03).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CATALOGO_MONEDAS,
  MONEDAS,
} from '../../src/domain/entities/moneda.ts';
import { AJUSTES_POR_DEFECTO } from '../../src/domain/entities/strategy-settings.ts';
import { SNAPSHOT_VACIO } from '../../src/domain/entities/finance-snapshot.ts';
import { MonedaFueraCatalogoError } from '../../src/domain/errors/moneda-errors.ts';

// Tabla exacta de progress/research/config-monedas-perfiles.md §4.
const ESPEJO_RUST = {
  MXN: { simbolo: '$', separador_miles: ',', separador_decimal: '.', simbolo_antes: true },
  USD: { simbolo: '$', separador_miles: ',', separador_decimal: '.', simbolo_antes: true },
  EUR: { simbolo: '€', separador_miles: '.', separador_decimal: ',', simbolo_antes: false },
};

describe('REQ-19-03: catálogo de monedas espejo del enum Rust', () => {
  it('define las divisas cerradas MXN USD EUR en ese orden', () => {
    assert.deepEqual([...MONEDAS], ['MXN', 'USD', 'EUR']);
  });

  it('cada divisa declara símbolo separadores y posición', () => {
    assert.deepEqual(CATALOGO_MONEDAS, ESPEJO_RUST);
  });
});

describe('REQ-19-01: currency en StrategySettings con defecto MXN', () => {
  it('AJUSTES_POR_DEFECTO lleva currency MXN', () => {
    assert.equal(AJUSTES_POR_DEFECTO.currency, 'MXN');
    assert.ok(Object.hasOwn(AJUSTES_POR_DEFECTO, 'currency'));
  });

  it('el snapshot vacío hereda la estrategia por defecto en MXN', () => {
    assert.equal(SNAPSHOT_VACIO.strategy.currency, 'MXN');
    assert.equal(SNAPSHOT_VACIO.strategy.debt_strategy, 'Avalanche');
  });
});

describe('REQ-19-05: error nombrado bajo src/domain/errors', () => {
  it('MonedaFueraCatalogoError es un Error nombrado del dominio', () => {
    const error = new MonedaFueraCatalogoError('CHF');
    assert.ok(error instanceof Error);
    assert.equal(error.name, 'MonedaFueraCatalogoError');
    assert.equal(error.codigo, 'CHF');
    assert.match(error.message, /CHF/);
  });
});
