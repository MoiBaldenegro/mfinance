// Suite F15 (1/2): validaciones del formulario del simulador de créditos
// (REQ-15-05): rechazo en español de plazo cero y tasa negativa antes de
// llamar al IPC.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  validarExtraordinario,
  validarPeticionSimulacion,
} from '../../src/domain/use-cases/simulador-validaciones.ts';

describe('validaciones del simulador (REQ-15-05)', () => {
  it('acepta una petición válida', () => {
    const r = validarPeticionSimulacion({
      importe: 10_000,
      plazoMeses: 12,
      tasaInteresAnual: 12,
    });
    assert.equal(r.ok, true);
  });

  it('rechaza plazo cero con mensaje en español', () => {
    const r = validarPeticionSimulacion({
      importe: 10_000,
      plazoMeses: 0,
      tasaInteresAnual: 12,
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.mensaje, /plazo/i);
    if (!r.ok) assert.ok(r.mensaje.length > 5);
  });

  it('rechaza plazo negativo con el mismo mensaje de plazo', () => {
    const r = validarPeticionSimulacion({
      importe: 10_000,
      plazoMeses: -3,
      tasaInteresAnual: 12,
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.mensaje, /plazo/i);
  });

  it('rechaza tasa negativa con mensaje en español', () => {
    const r = validarPeticionSimulacion({
      importe: 10_000,
      plazoMeses: 12,
      tasaInteresAnual: -0.5,
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.mensaje, /tasa/i);
  });

  it('rechaza importe no positivo con mensaje en español', () => {
    for (const importe of [0, -100]) {
      const r = validarPeticionSimulacion({
        importe,
        plazoMeses: 12,
        tasaInteresAnual: 12,
      });
      assert.equal(r.ok, false);
      if (!r.ok) assert.match(r.mensaje, /importe/i);
    }
  });

  it('valida el pago extraordinario puntual entre mes 1 y el plazo', () => {
    assert.equal(validarExtraordinario(3, 2_000, 12).ok, true);
    const fueraDeRango = validarExtraordinario(13, 2_000, 12);
    assert.equal(fueraDeRango.ok, false);
    const mesCero = validarExtraordinario(0, 2_000, 12);
    assert.equal(mesCero.ok, false);
    const importeCero = validarExtraordinario(3, 0, 12);
    assert.equal(importeCero.ok, false);
    if (!importeCero.ok) assert.match(importeCero.mensaje, /extraordinario/i);
  });
});
