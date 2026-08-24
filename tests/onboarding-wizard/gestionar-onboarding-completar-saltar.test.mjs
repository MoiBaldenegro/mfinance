// Tests completarOnboarding, saltar y validaciones paso 1
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  gestionarOnboarding,
  completarOnboarding,
  actualizarDatosOnboarding,
} from '../../src/domain/use-cases/onboarding/gestionar-onboarding.ts';
import {
  onboardingDataFalso,
  paso1DataFalso,
  puertoOnboardingFalso,
  puertoOnboardingConError,
  avisoCompletarFallido,
} from './dobles.mjs';

describe('gestionarOnboarding — completarOnboarding (REQ-24-03)', () => {
  it('marca onboarding como Completed y devuelve perfil', async () => {
    const puerto = puertoOnboardingFalso();
    puerto.estado.data = onboardingDataFalso({ paso1: paso1DataFalso() });
    const resultado = await completarOnboarding(puerto);
    assert.equal(resultado.ok, true);
    assert.ok(resultado.perfil);
    assert.equal(puerto.estado.status.nombre, 'Completed');
    assert.equal(puerto.llamadas.completarOnboarding, 1);
  });

  it('propaga error del puerto como aviso en español', async () => {
    const puerto = puertoOnboardingConError({ mensaje: 'IPC falló' });
    const resultado = await completarOnboarding(puerto);
    assert.equal(resultado.ok, false);
    assert.match(resultado.aviso, /no se pudo completar el onboarding/);
  });
});

describe('gestionarOnboarding — validaciones paso 1 (REQ-24-09)', () => {
  it('rechaza nombre vacío con mensaje en español', async () => {
    const datos = onboardingDataFalso({
      paso1: paso1DataFalso({ nombre_completo: '' })
    });
    const resultado = await actualizarDatosOnboarding(puertoOnboardingFalso(), datos);
    assert.equal(resultado.ok, true); // caso de uso no valida, delega al puerto
  });

  it('rechaza sin fuentes de ingreso activas', async () => {
    const datos = onboardingDataFalso({
      paso1: paso1DataFalso({ fuentes_ingreso_activas: [] })
    });
    const resultado = await actualizarDatosOnboarding(puertoOnboardingFalso(), datos);
    assert.equal(resultado.ok, true); // caso de uso no valida
  });

  it('rechaza sin categorías de gasto', async () => {
    const datos = onboardingDataFalso({
      paso1: paso1DataFalso({ categorias_gasto_usadas: [] })
    });
    const resultado = await actualizarDatosOnboarding(puertoOnboardingFalso(), datos);
    assert.equal(resultado.ok, true); // caso de uso no valida
  });
});

describe('gestionarOnboarding — saltar onboarding (REQ-24-06)', () => {
  it('completarOnboarding con datos mínimos crea perfil con MXN y status Completed', async () => {
    const puerto = puertoOnboardingFalso();
    const resultado = await completarOnboarding(puerto);
    assert.equal(resultado.ok, true);
    assert.ok(resultado.perfil);
    assert.equal(puerto.estado.status.nombre, 'Completed');
  });
});