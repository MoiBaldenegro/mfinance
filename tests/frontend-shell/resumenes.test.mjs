// Suite F5 (3/3): resúmenes de sección en español calculados sobre los
// datos reales del snapshot (placeholders REQ-05-04 sin React).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SECCIONES } from '../../src/components/shell/secciones.ts';
import {
  mesDeTrabajo,
  resumenDeSeccion,
} from '../../src/domain/use-cases/resumenes-secciones.ts';
import { snapshotDePrueba } from './helpers.mjs';

describe('resúmenes de secciones sobre datos reales del snapshot', () => {
  const snapshot = snapshotDePrueba();

  it('mes de trabajo = mes del último registro; null si no hay registros', () => {
    assert.equal(mesDeTrabajo(snapshot), '2026-08');
    assert.equal(mesDeTrabajo({ ...snapshot, monthly_records: [] }), null);
  });

  it('Registro resume nº de meses y último mes', () => {
    const texto = resumenDeSeccion('registro', snapshot);
    assert.ok(texto.includes('2 registros mensuales'));
    assert.ok(texto.includes('2026-08'));
  });

  it('PyG calcula la utilidad del último mes en euros', () => {
    // Ingresos 3450 − gastos 1874 = 1576.
    const texto = resumenDeSeccion('pyg', snapshot);
    assert.ok(texto.includes('1.576,00 €'));
    assert.ok(texto.includes('2026-08'));
  });

  it('Balance calcula patrimonio activos − pasivos', () => {
    // Activos 4180.50 − pasivos 10700 = −6519.50.
    const texto = resumenDeSeccion('balance', snapshot);
    assert.ok(texto.includes('-6.519,50 €'));
  });

  it('Deuda suma saldos pendientes y nombra la estrategia en español', () => {
    const texto = resumenDeSeccion('deuda', snapshot);
    assert.ok(texto.includes('10.700,00 €'));
    assert.ok(texto.includes('Avalancha'));
  });

  it('Inversiones totaliza valor actual y aporte mensual', () => {
    const texto = resumenDeSeccion('inversiones', snapshot);
    assert.ok(texto.includes('20.200,00 €'));
    assert.ok(texto.includes('400,00 €'));
  });

  it('Indicadores muestra la tasa de ahorro del último mes', () => {
    // 1576 / 3450 = 45.68 % → redondeado a un decimal: 45,7 %.
    const texto = resumenDeSeccion('indicadores', snapshot);
    assert.ok(texto.includes('45,7 %'));
  });

  it('Conciliación cuenta cuántas cuentas cuadran', () => {
    // Principal cuadra (1000+2500=3500); Secundaria no (500≠999).
    const texto = resumenDeSeccion('conciliacion', snapshot);
    assert.ok(texto.includes('1 de 2'));
    assert.ok(texto.includes('499,00 €'));
  });

  it('Cierre indica el último mes disponible', () => {
    assert.ok(resumenDeSeccion('cierre', snapshot).includes('2026-08'));
  });

  it('Diagnóstico informa de meses con datos', () => {
    assert.ok(resumenDeSeccion('diagnostico', snapshot).includes('2 meses'));
  });

  it('Ajustes refleja estrategia y pago extra actual', () => {
    const texto = resumenDeSeccion('ajustes', snapshot);
    assert.ok(texto.includes('Avalancha'));
    assert.ok(texto.includes('120,00 €'));
  });

  it('id desconocido devuelve cadena vacía sin lanzar', () => {
    assert.equal(resumenDeSeccion('seccion-inexistente', snapshot), '');
  });

  it('ninguna sección rompe con un snapshot vacío', () => {
    const vacio = {
      monthly_records: [],
      assets: [],
      liabilities: [],
      investments: [],
      account_statements: [],
      strategy: { debt_strategy: 'Avalanche', extra_monthly_payment: 0 },
    };
    for (const seccion of SECCIONES) {
      assert.equal(typeof resumenDeSeccion(seccion.id, vacio), 'string');
    }
  });
});
