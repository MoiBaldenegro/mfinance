// Suite F8: transformación de activos y pasivos a filas formateadas
// para la tabla (REQ-08-01/02), con formato es-ES euros.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  activosAFilas,
  pasivosAFilas,
  CATEGORIA_ACTIVO_LABELS,
  CATEGORIAS_ACTIVO_CANONICAS,
} from '../../src/domain/use-cases/balance-tabla.ts';

const ACTIVOS = [
  { nombre: 'Cuenta corriente', categoria: 'liquido', valor_actual: 5000 },
  { nombre: 'Fondo indexado', categoria: 'inversion', valor_actual: 15000 },
  { nombre: 'Piso en alquiler', categoria: 'propiedad', valor_actual: 120000 },
];

const PASIVOS = [
  { nombre: 'Hipoteca', saldo_pendiente: 80000, tasa_interes_anual: 3.2 },
  { nombre: 'Préstamo coche', saldo_pendiente: 12000, tasa_interes_anual: 5.5 },
];

describe('filas de tabla Balance desde activos y pasivos (REQ-08-01/02)', () => {
  it('activos: devuelve filas con nombre, categoría, label y valor formateado', () => {
    const filas = activosAFilas(ACTIVOS, 'EUR');
    assert.equal(filas.length, 3);
    assert.deepEqual(filas[0], {
      nombre: 'Cuenta corriente',
      categoria: 'liquido',
      categoriaLabel: 'Líquido',
      valorActual: '5.000,00 €',
    });
    assert.deepEqual(filas[1], {
      nombre: 'Fondo indexado',
      categoria: 'inversion',
      categoriaLabel: 'Inversión',
      valorActual: '15.000,00 €',
    });
    assert.deepEqual(filas[2], {
      nombre: 'Piso en alquiler',
      categoria: 'propiedad',
      categoriaLabel: 'Propiedad',
      valorActual: '120.000,00 €',
    });
  });

  it('pasivos: devuelve filas con nombre, saldo formateado y tasa "X,X %"', () => {
    const filas = pasivosAFilas(PASIVOS, 'EUR');
    assert.equal(filas.length, 2);
    assert.deepEqual(filas[0], {
      nombre: 'Hipoteca',
      saldoPendiente: '80.000,00 €',
      tasaInteresAnual: '3,2 %',
    });
    assert.deepEqual(filas[1], {
      nombre: 'Préstamo coche',
      saldoPendiente: '12.000,00 €',
      tasaInteresAnual: '5,5 %',
    });
  });

  it('categorías canónicas y labels cubren las tres opciones', () => {
    assert.deepEqual(CATEGORIAS_ACTIVO_CANONICAS, ['liquido', 'inversion', 'propiedad']);
    assert.equal(CATEGORIA_ACTIVO_LABELS.liquido, 'Líquido');
    assert.equal(CATEGORIA_ACTIVO_LABELS.inversion, 'Inversión');
    assert.equal(CATEGORIA_ACTIVO_LABELS.propiedad, 'Propiedad');
  });

  it('arrays vacíos devuelven arrays vacíos', () => {
    assert.deepEqual(activosAFilas([], 'EUR'), []);
    assert.deepEqual(pasivosAFilas([], 'EUR'), []);
  });
});