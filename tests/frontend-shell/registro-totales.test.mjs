// Suite F6 (1/5): totales del registro mensual (REQ-06-05) calculados
// desde un MonthlyRecord, con subtotal por tarjeta y utilidad del mes.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  totalGastos,
  totalIngresos,
} from '../../src/domain/entities/monthly-record.ts';
import {
  totalesDeRegistro,
} from '../../src/domain/use-cases/totales-registro.ts';
import {
  numeroSeguro,
} from '../../src/domain/use-cases/validacion-importes.ts';

const REGISTRO_REAL = {
  mes: '2026-08',
  ingresos: { Salario: 2500, Freelance: 300, Arriendos: 650 },
  gastos: { Vivienda: 980, Alimentacion: 380, CuotasDeuda: 364, Ocio: 150 },
};

describe('subtotales y totales desde un MonthlyRecord (REQ-06-05)', () => {
  it('subtotal de ingresos suma solo las fuentes presentes', () => {
    assert.equal(totalIngresos(REGISTRO_REAL), 3450);
    assert.equal(totalIngresos({ mes: '2026-01', ingresos: {}, gastos: {} }), 0);
  });

  it('subtotal de gastos suma solo las categorías presentes', () => {
    assert.equal(totalGastos(REGISTRO_REAL), 1874);
  });

  it('fila de totales: ingresos, gastos y utilidad del mes', () => {
    const totales = totalesDeRegistro(REGISTRO_REAL);
    assert.deepEqual(totales, { ingresos: 3450, gastos: 1874, utilidad: 1576 });
  });

  it('utilidad negativa cuando los gastos superan los ingresos', () => {
    const deficit = {
      mes: '2026-02',
      ingresos: { Salario: 1000 },
      gastos: { Vivienda: 1250 },
    };
    assert.equal(totalesDeRegistro(deficit).utilidad, -250);
  });

  it('mes abierto a ceros produce fila de totales en cero (REQ-06-08)', () => {
    const vacio = totalesDeRegistro({ mes: '2026-03', ingresos: {}, gastos: {} });
    assert.deepEqual(vacio, { ingresos: 0, gastos: 0, utilidad: 0 });
  });
});

describe('numeroSeguro alimenta los subtotales EN VIVO mientras se escribe', () => {
  it('convierte el texto tecleado en número tolerando coma decimal', () => {
    assert.equal(numeroSeguro('1234.56'), 1234.56);
    assert.equal(numeroSeguro('1234,56'), 1234.56);
    assert.equal(numeroSeguro(''), 0);
  });

  it('devuelve cero ante texto no numérico sin lanzar nunca', () => {
    assert.equal(numeroSeguro('abc'), 0);
    assert.equal(numeroSeguro('--3'), 0);
  });

  it('mantiene negativos para la vista previa (el guardado sí bloquea)', () => {
    assert.equal(numeroSeguro('-5'), -5);
  });
});
