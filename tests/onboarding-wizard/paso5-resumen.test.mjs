// REQ-27-05: resumen del onboarding — 8 secciones con checks y totales.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { construirResumenOnboarding } from '../../src/domain/use-cases/onboarding/onboarding-resumen.ts';

const METAS = [
  { id: 'g_1', titulo: 'Comprar casa', descripcion: '', tags: [], creado_en: '2026-08-23T00:00:00Z' },
];

function datosCompletos() {
  return {
    paso1: {
      nombre_completo: 'Ana García', moneda: 'MXN',
      fuentes_ingreso_activas: ['salario', 'freelance'],
      categorias_gasto_usadas: ['vivienda'],
    },
    paso2: {
      activos: [{ nombre: 'Cuenta', categoria: 'liquido', valor_actual: 310000 }],
      pasivos: [{ nombre: 'Tarjeta', saldo_pendiente: 10000, tasa_interes_anual: 24 }],
      inversiones: [
        { familia: 'renta_fija', aporte_mensual: 500, valor_actual: 5000, tasa_esperada_anual: 7 },
        { familia: 'renta_variable', aporte_mensual: 200, valor_actual: 2000, tasa_esperada_anual: 9 },
      ],
    },
    paso3: {
      estrategia_deuda: 'Avalanche', pago_extra_mensual: 300,
      supuestos_proyeccion: [{ variable: 'salario', porcentaje: 5 }],
    },
    paso4: {
      umbrales: {
        endeudamiento_verde: 15, endeudamiento_rojo: 30,
        ahorro_verde: 20, ahorro_rojo: 5,
        fondo_verde: 3, fondo_rojo: 1,
        ingreso_pasivo_verde: 100, ingreso_pasivo_amarillo: 25,
      },
    },
  };
}

describe('construirResumenOnboarding — secciones, checks y totales (REQ-27-05)', () => {
  it('genera las 8 secciones en orden y todas completas con datos', () => {
    const secciones = construirResumenOnboarding(datosCompletos(), METAS);
    assert.deepEqual(
      secciones.map((s) => s.id),
      ['personales', 'fuentes', 'categorias', 'balance', 'deuda', 'proyeccion', 'indicadores', 'metas'],
    );
    for (const s of secciones) assert.equal(s.completo, true, s.id);
  });

  it('personales muestra nombre y etiqueta de moneda', () => {
    const [p] = construirResumenOnboarding(datosCompletos(), []);
    assert.ok(p.lineas.some((l) => l.includes('Ana García')));
    assert.ok(p.lineas.some((l) => l.includes('Pesos mexicanos')));
  });

  it('balance calcula totales: activos, pasivos, patrimonio y aportes', () => {
    const balance = construirResumenOnboarding(datosCompletos(), []).find((s) => s.id === 'balance');
    assert.ok(balance.lineas.some((l) => /Activos: .*310,000\.00/.test(l)));
    assert.ok(balance.lineas.some((l) => /Pasivos: .*10,000\.00/.test(l)));
    assert.ok(balance.lineas.some((l) => /Patrimonio: .*300,000\.00/.test(l)));
    // Aportes mensuales: 500 + 200 = 700.
    assert.ok(balance.lineas.some((l) => /700\.00/.test(l)));
  });

  it('deuda muestra estrategia en español y pago extra formateado', () => {
    const deuda = construirResumenOnboarding(datosCompletos(), []).find((s) => s.id === 'deuda');
    assert.ok(deuda.lineas.some((l) => l.includes('Avalancha')));
    assert.ok(deuda.lineas.some((l) => /300\.00/.test(l)));
  });

  it('indicadores distingue personalizado de defecto y metas cuenta entradas', () => {
    const secciones = construirResumenOnboarding(datosCompletos(), METAS);
    assert.match(secciones.find((s) => s.id === 'indicadores').lineas.join(' '), /personalizados/);
    assert.ok(secciones.find((s) => s.id === 'metas').lineas[0].includes('1'));
  });

  it('sin datos todo está incompleto pero el resumen no explota', () => {
    const vacio = { paso1: null, paso2: null, paso3: null, paso4: null };
    const secciones = construirResumenOnboarding(vacio, []);
    assert.equal(secciones.length, 8);
    for (const s of secciones) assert.equal(s.completo, false, s.id);
  });
});
