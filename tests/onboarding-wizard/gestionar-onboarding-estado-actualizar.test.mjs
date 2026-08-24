// Tests obtenerEstado y actualizarDatos
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  gestionarOnboarding,
  obtenerEstadoOnboarding,
  actualizarDatosOnboarding,
} from '../../src/domain/use-cases/onboarding/gestionar-onboarding.ts';
import {
  onboardingDataFalso,
  paso1DataFalso,
  onboardingStatusNotStarted,
  onboardingStatusInProgress,
  onboardingStatusCompleted,
  puertoOnboardingFalso,
  puertoOnboardingConError,
  avisoCargaFallida,
  avisoGuardadoFallido,
} from './dobles.mjs';

describe('gestionarOnboarding — obtenerEstado (REQ-24-03)', () => {
  it('devuelve NotStarted cuando no hay onboarding iniciado', async () => {
    const puerto = puertoOnboardingFalso();
    const resultado = await obtenerEstadoOnboarding(puerto);
    assert.deepEqual(resultado, onboardingStatusNotStarted());
    assert.equal(puerto.llamadas.obtenerEstado, 1);
  });

  it('devuelve InProgress con step guardado cuando hay datos parciales', async () => {
    const puerto = puertoOnboardingFalso();
    puerto.estado.status = onboardingStatusInProgress(2);
    puerto.estado.data = onboardingDataFalso({ paso1: paso1DataFalso() });
    const resultado = await obtenerEstadoOnboarding(puerto);
    assert.deepEqual(resultado, onboardingStatusInProgress(2));
    assert.equal(puerto.llamadas.obtenerEstado, 1);
  });

  it('devuelve Completed cuando el onboarding ya terminó', async () => {
    const puerto = puertoOnboardingFalso();
    puerto.estado.status = onboardingStatusCompleted();
    const resultado = await obtenerEstadoOnboarding(puerto);
    assert.deepEqual(resultado, onboardingStatusCompleted());
  });

  it('propaga error del puerto como aviso en español', async () => {
    const puerto = puertoOnboardingConError({ mensaje: 'IPC falló' });
    const resultado = await obtenerEstadoOnboarding(puerto);
    assert.ok(resultado instanceof Error);
    assert.match(resultado.message, /no se pudo cargar el estado del onboarding/);
  });
});

describe('gestionarOnboarding — actualizarDatos (REQ-24-03, 24-05)', () => {
  it('guarda datos parciales del paso 1 en el puerto', async () => {
    const puerto = puertoOnboardingFalso();
    const datos = onboardingDataFalso({ paso1: paso1DataFalso() });
    const resultado = await actualizarDatosOnboarding(puerto, datos);
    assert.equal(resultado.ok, true);
    assert.deepEqual(puerto.estado.data, datos);
    assert.equal(puerto.llamadas.actualizarDatos, 1);
  });

  it('pasa los datos tal cual al puerto (merge se hace en el hook)', async () => {
    const puerto = puertoOnboardingFalso();
    puerto.estado.data = onboardingDataFalso({ paso1: paso1DataFalso() });
    const paso2 = { activos: [], pasivos: [], inversiones: [] };
    const resultado = await actualizarDatosOnboarding(puerto, { paso2 });
    assert.equal(resultado.ok, true);
    assert.deepEqual(puerto.estado.data, { paso2 });
  });

  it('propaga error del puerto como aviso en español', async () => {
    const puerto = puertoOnboardingConError({ mensaje: 'IPC falló' });
    const resultado = await actualizarDatosOnboarding(puerto, onboardingDataFalso());
    assert.equal(resultado.ok, false);
    assert.match(resultado.aviso, /no se pudo guardar el progreso del onboarding/);
  });
});