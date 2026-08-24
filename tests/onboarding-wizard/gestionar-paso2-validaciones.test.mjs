// Tests de validaciones: activos, pasivos, inversiones (reutiliza features 8/11)
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { actualizarPaso2Onboarding } from '../../src/domain/use-cases/onboarding/gestionar-paso2-balance.ts';
import {
  puertoOnboardingFalso,
  paso2DataVacio,
  onboardingDataVacio,
  activoValido,
  pasivoValido,
  inversionValida,
} from './gestionar-paso2-dobles.mjs';

describe('F25 — gestionarPaso2Onboarding.validaciones (REQ-25-06)', () => {
  describe('validaciones de activos (reutiliza feature 8)', () => {
    it('rechaza activo con valor negativo', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), activos: [activoValido({ valor_actual: -100 })] };
      const resultado = await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.equal(resultado.ok, false);
      assert.match(resultado.aviso, /El valor del activo no puede ser negativo/);
    });

    it('acepta activo con valor positivo', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), activos: [activoValido({ valor_actual: 1000 })] };
      const resultado = await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.equal(resultado.ok, true);
    });
  });

  describe('validaciones de pasivos (reutiliza feature 8 + 11)', () => {
    it('rechaza pasivo con saldo negativo', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), pasivos: [pasivoValido({ saldo_pendiente: -100 })] };
      const resultado = await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.equal(resultado.ok, false);
      assert.match(resultado.aviso, /El saldo pendiente no puede ser negativo/);
    });

    it('rechaza pasivo con tasa negativa', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), pasivos: [pasivoValido({ tasa_interes_anual: -1 })] };
      const resultado = await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.equal(resultado.ok, false);
      assert.match(resultado.aviso, /La tasa de interés anual no puede ser negativa/);
    });

    it('rechaza pasivo con tasa > 30%', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), pasivos: [pasivoValido({ tasa_interes_anual: 31 })] };
      const resultado = await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.equal(resultado.ok, false);
      assert.match(resultado.aviso, /La tasa no puede superar el 30% anual/);
    });

    it('acepta pasivo con saldo positivo y tasa en [0,30]', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), pasivos: [pasivoValido({ saldo_pendiente: 100000, tasa_interes_anual: 5 })] };
      const resultado = await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.equal(resultado.ok, true);
    });
  });

  describe('validaciones de inversiones (reutiliza feature 11)', () => {
    it('rechaza inversión con tasa negativa', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), inversiones: [inversionValida({ tasa_esperada_anual: -1 })] };
      const resultado = await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.equal(resultado.ok, false);
      assert.match(resultado.aviso, /La tasa no puede ser negativa/);
    });

    it('rechaza inversión con tasa > 30%', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), inversiones: [inversionValida({ tasa_esperada_anual: 31 })] };
      const resultado = await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.equal(resultado.ok, false);
      assert.match(resultado.aviso, /La tasa no puede superar el 30% anual/);
    });

    it('acepta inversión con tasa en [0,30]', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), inversiones: [inversionValida({ tasa_esperada_anual: 7 })] };
      const resultado = await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.equal(resultado.ok, true);
    });
  });
});