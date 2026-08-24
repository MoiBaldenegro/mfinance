// Tests de merge, persistencia y manejo de errores
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { actualizarPaso2Onboarding } from '../../src/domain/use-cases/onboarding/gestionar-paso2-balance.ts';
import {
  puertoOnboardingFalso,
  puertoOnboardingConError,
  paso2DataVacio,
  onboardingDataVacio,
  activoValido,
  pasivoValido,
  inversionValida,
} from './gestionar-paso2-dobles.mjs';

describe('F25 — gestionarPaso2Onboarding.merge y errores (REQ-25-06)', () => {
  describe('merge y persistencia', () => {
    it('actualiza onboarding_data.paso2.activos', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), activos: [activoValido({ nombre: 'Cuenta', valor_actual: 5000 })] };
      await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.deepEqual(puerto.estado.datos.paso2.activos, [{ nombre: 'Cuenta', categoria: 'liquido', valor_actual: 5000 }]);
    });

    it('actualiza onboarding_data.paso2.pasivos', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), pasivos: [pasivoValido({ nombre: 'Tarjeta', saldo_pendiente: 2000, tasa_interes_anual: 15 })] };
      await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.deepEqual(puerto.estado.datos.paso2.pasivos, [{ nombre: 'Tarjeta', saldo_pendiente: 2000, tasa_interes_anual: 15 }]);
    });

    it('actualiza onboarding_data.paso2.inversiones', async () => {
      const puerto = puertoOnboardingFalso();
      const paso2 = { ...paso2DataVacio(), inversiones: [inversionValida({ familia: 'renta_variable', aporte_mensual: 200, valor_actual: 10000, tasa_esperada_anual: 10 })] };
      await actualizarPaso2Onboarding(puerto, paso2, onboardingDataVacio());
      assert.deepEqual(puerto.estado.datos.paso2.inversiones, [{ familia: 'renta_variable', aporte_mensual: 200, valor_actual: 10000, tasa_esperada_anual: 10 }]);
    });

    it('hace merge con datos existentes del onboarding (paso1 se conserva)', async () => {
      const puerto = puertoOnboardingFalso();
      const datosExistentes = {
        paso1: { nombre_completo: 'Juan', moneda: 'MXN', fuentes_ingreso_activas: ['salario'], categorias_gasto_usadas: ['vivienda'] },
        paso2: { activos: [], pasivos: [], inversiones: [] },
        paso3: null,
        paso4: null,
      };
      const paso2 = { ...paso2DataVacio(), activos: [activoValido()] };
      await actualizarPaso2Onboarding(puerto, paso2, datosExistentes);
      assert.equal(puerto.estado.datos.paso1.nombre_completo, 'Juan');
      assert.equal(puerto.estado.datos.paso2.activos.length, 1);
    });
  });

  describe('manejo de errores del puerto', () => {
    it('propaga error del puerto como aviso en español', async () => {
      const puerto = puertoOnboardingConError();
      const resultado = await actualizarPaso2Onboarding(puerto, paso2DataVacio(), onboardingDataVacio());
      assert.equal(resultado.ok, false);
      assert.match(resultado.aviso, /no se pudo guardar el progreso del onboarding/);
    });
  });
});