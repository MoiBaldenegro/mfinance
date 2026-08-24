// Suite F6 (2/5): validación de importes (REQ-06-06): negativos y no
// numéricos se rechazan con errores nombrados en español.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ImporteNegativoError,
  ImporteNoNumericoError,
} from '../../src/domain/errors/importe-errors.ts';
import {
  parsearImporte,
  validarCamposImporte,
} from '../../src/domain/use-cases/validacion-importes.ts';

describe('parsearImporte acepta euros bien formados', () => {
  it('acepta enteros y decimales con punto', () => {
    assert.equal(parsearImporte('980'), 980);
    assert.equal(parsearImporte('1234.56'), 1234.56);
  });

  it('acepta coma decimal española', () => {
    assert.equal(parsearImporte('1234,56'), 1234.56);
  });

  it('campo vacío o en blanco cuenta como cero', () => {
    assert.equal(parsearImporte(''), 0);
    assert.equal(parsearImporte('   '), 0);
  });
});

describe('parsearImporte rechaza lo inválido con error nombrado español', () => {
  it('texto no numérico lanza ImporteNoNumericoError', () => {
    assert.throws(
      () => parsearImporte('abc'),
      (error) => error instanceof ImporteNoNumericoError &&
        error.name === 'ImporteNoNumericoError',
    );
  });

  it('el mensaje del no numérico está en español y cita el valor', () => {
    try {
      parsearImporte('doce');
      assert.fail('debía lanzar');
    } catch (error) {
      assert.match(error.message, /no numérico/);
      assert.ok(error.message.includes('doce'));
    }
  });

  it('importe negativo lanza ImporteNegativoError', () => {
    assert.throws(
      () => parsearImporte('-150'),
      (error) => error instanceof ImporteNegativoError &&
        error.name === 'ImporteNegativoError',
    );
  });

  it('el mensaje del negativo está en español y cita el valor', () => {
    try {
      parsearImporte('-150');
      assert.fail('debía lanzar');
    } catch (error) {
      assert.match(error.message, /negativ/);
      assert.ok(error.message.includes('-150'));
    }
  });

  it('Infinity y NaN textuales no son importes válidos', () => {
    assert.throws(() => parsearImporte('Infinity'), ImporteNoNumericoError);
    assert.throws(() => parsearImporte('NaN'), ImporteNoNumericoError);
  });
});

describe('validarCamposImporte recopila los errores campo a campo', () => {
  it('devuelve solo los campos inválidos con su mensaje en español', () => {
    const errores = validarCamposImporte([
      { clave: 'ingreso:Salario', etiqueta: 'Salario', texto: '2500' },
      { clave: 'gasto:Vivienda', etiqueta: 'Vivienda', texto: '-100' },
      { clave: 'gasto:Ocio', etiqueta: 'Ocio', texto: 'abc' },
    ]);
    assert.deepEqual(
      errores.map((error) => error.clave),
      ['gasto:Vivienda', 'gasto:Ocio'],
    );
    assert.match(errores[0].mensaje, /negativ/);
    assert.match(errores[1].mensaje, /numérico/);
  });

  it('sin campos inválidos devuelve una lista vacía', () => {
    const errores = validarCamposImporte([
      { clave: 'ingreso:Otros', etiqueta: 'Otros', texto: '' },
      { clave: 'gasto:Ocio', etiqueta: 'Ocio', texto: '42' },
    ]);
    assert.deepEqual(errores, []);
  });
});
