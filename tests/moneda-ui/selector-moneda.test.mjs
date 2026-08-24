// Suite F20 (REQ-20-01/06): catálogo etiquetado en español para el
// selector de Ajustes, caso de uso de cambio de moneda sobre el snapshot
// (inmutabilidad + error nombrado) y guardia del snapshot antiguo sin
// campo currency (defecto MXN sin errores). Escrito ANTES del código.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MONEDAS } from '../../src/domain/entities/moneda.ts';
import { ETIQUETA_MONEDA } from '../../src/domain/entities/moneda.ts';
import { MonedaFueraCatalogoError } from '../../src/domain/errors/moneda-errors.ts';
import { cambiarMoneda } from '../../src/domain/use-cases/cambiar-moneda.ts';
import { monedaDeSnapshot } from '../../src/domain/use-cases/moneda-snapshot.ts';
import { snapshotDePrueba } from '../frontend-shell/helpers.mjs';

describe('etiquetas en español del selector (REQ-20-01)', () => {
  it('cubre exactamente las tres divisas del catálogo', () => {
    assert.deepEqual(Object.keys(ETIQUETA_MONEDA), [...MONEDAS]);
  });

  it('etiqueta las tres opciones en español', () => {
    assert.equal(ETIQUETA_MONEDA.MXN, 'Pesos mexicanos');
    assert.equal(ETIQUETA_MONEDA.USD, 'Dólares');
    assert.equal(ETIQUETA_MONEDA.EUR, 'Euros');
  });
});

describe('cambio de moneda sobre el snapshot (REQ-20-01)', () => {
  const snapshot = snapshotDePrueba();
  // Fixture "antiguo": estrategia sin campo currency.
  const { currency: _omitida, ...estrategiaAntigua } = snapshot.strategy;
  const antiguo = { ...snapshot, strategy: estrategiaAntigua };

  it('devuelve un NUEVO snapshot con la moneda cambiada y el resto intacto', () => {
    const nuevo = cambiarMoneda(snapshot, 'EUR');
    assert.notEqual(nuevo, snapshot);
    assert.equal(nuevo.strategy.currency, 'EUR');
    assert.deepEqual(
      { ...nuevo.strategy, currency: undefined },
      { ...snapshot.strategy, currency: undefined },
    );
    assert.deepEqual(nuevo.monthly_records, snapshot.monthly_records);
    assert.deepEqual(nuevo.assets, snapshot.assets);
    assert.deepEqual(nuevo.liabilities, snapshot.liabilities);
    assert.deepEqual(nuevo.investments, snapshot.investments);
    // El original no muta:
    assert.equal(snapshot.strategy.currency, 'EUR');
  });

  it('acepta MXN y USD además de EUR', () => {
    assert.equal(cambiarMoneda(snapshot, 'MXN').strategy.currency, 'MXN');
    assert.equal(cambiarMoneda(snapshot, 'USD').strategy.currency, 'USD');
  });

  it('una moneda fuera del catálogo lanza el error nombrado', () => {
    assert.throws(() => cambiarMoneda(snapshot, 'GBP'), MonedaFueraCatalogoError);
    assert.throws(() => cambiarMoneda(snapshot, 'eur'), MonedaFueraCatalogoError);
  });

  it('un snapshot antiguo sin currency puede cambiar a EUR directamente', () => {
    const nuevo = cambiarMoneda(antiguo, 'EUR');
    assert.equal(nuevo.strategy.currency, 'EUR');
    assert.deepEqual(nuevo.monthly_records, antiguo.monthly_records);
  });
});

describe('snapshot antiguo sin campo currency → MXN sin errores (REQ-20-06)', () => {
  it('snapshot indefinido o nulo cae a MXN', () => {
    assert.equal(monedaDeSnapshot(undefined), 'MXN');
    assert.equal(monedaDeSnapshot(null), 'MXN');
  });

  it('snapshot sin strategy o sin currency cae a MXN', () => {
    assert.equal(monedaDeSnapshot({}), 'MXN');
    assert.equal(monedaDeSnapshot({ strategy: {} }), 'MXN');
  });

  it('un valor fuera de catálogo o minúscula cae a MXN', () => {
    assert.equal(monedaDeSnapshot({ strategy: { currency: 'GBP' } }), 'MXN');
    assert.equal(monedaDeSnapshot({ strategy: { currency: 'eur' } }), 'MXN');
  });

  it('respeta una moneda válida del catálogo', () => {
    assert.equal(monedaDeSnapshot({ strategy: { currency: 'EUR' } }), 'EUR');
    assert.equal(monedaDeSnapshot({ strategy: { currency: 'USD' } }), 'USD');
    assert.equal(monedaDeSnapshot({ strategy: { currency: 'MXN' } }), 'MXN');
  });

  it('los resúmenes no rompen con un snapshot antiguo sin currency', () => {
    // Fixture sin currency: debe tratarse como MXN.
    const { currency: _omitida, ...estrategiaAntigua } = snapshotDePrueba().strategy;
    assert.equal(monedaDeSnapshot({ strategy: estrategiaAntigua }), 'MXN');
  });
});
