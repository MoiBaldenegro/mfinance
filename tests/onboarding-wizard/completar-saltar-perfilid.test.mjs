// REQ-27-06/08: Finalizar delega en completarOnboarding pasando el
// perfilId; Saltar guarda los mínimos (nombre+MXN+defaults). La
// consolidación real del snapshot se verifica en cargo test.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  completarOnboarding,
  saltarOnboarding,
} from '../../src/domain/use-cases/onboarding/onboarding-paso5.ts';

function puertoQueConsolida() {
  const llamadas = { completar: [], actualizarDatos: [] };
  const onboarding = {
    obtenerEstado: async () => ({ nombre: 'InProgress', current_step: 5 }),
    actualizarDatos: async (datos, perfilId) => { llamadas.actualizarDatos.push({ datos, perfilId }); },
    completarOnboarding: async (perfilId) => {
      llamadas.completar.push(perfilId);
      return {
        id: perfilId ?? 'p_activo', nombre: 'Ana García',
        creado_en: '2026-08-23T00:00:00Z', onboarding_status: { nombre: 'Completed' },
      };
    },
    agregarMeta: async () => ({}), actualizarMeta: async () => ({}), eliminarMeta: async () => {},
  };
  return { puertos: { onboarding }, llamadas };
}

describe('completarOnboarding — delegación con perfilId (REQ-27-06)', () => {
  it('Finalizar delega en el puerto pasando el perfilId y devuelve el perfil', async () => {
    const ctx = puertoQueConsolida();
    const r = await completarOnboarding(ctx.puertos, 'p_27');
    assert.equal(r.ok, true);
    assert.equal(r.perfil.nombre, 'Ana García');
    assert.deepEqual(ctx.llamadas.completar, ['p_27']);
  });

  it('fallo del puerto produce aviso en español sin lanzar', async () => {
    const puertos = {
      onboarding: {
        obtenerEstado: async () => ({}), actualizarDatos: async () => {},
        completarOnboarding: async () => { throw { mensaje: 'boom' }; },
        agregarMeta: async () => ({}), actualizarMeta: async () => ({}), eliminarMeta: async () => {},
      },
    };
    const r = await completarOnboarding(puertos);
    assert.equal(r.ok, false);
    assert.match(r.aviso, /no se pudo completar el onboarding/);
  });
});

describe('saltarOnboarding — perfil mínimo (REQ-27-08)', () => {
  it('guarda mínimos (nombre+MXN+defaults) y completa con perfilId', async () => {
    const ctx = puertoQueConsolida();
    const r = await saltarOnboarding(ctx.puertos, { nombre_completo: 'Luis' }, 'p_9');
    assert.equal(r.ok, true);
    assert.equal(ctx.llamadas.actualizarDatos.length, 1);
    const { datos, perfilId } = ctx.llamadas.actualizarDatos[0];
    assert.equal(perfilId, 'p_9');
    assert.equal(datos.paso1.nombre_completo, 'Luis');
    assert.equal(datos.paso1.moneda, 'MXN');
    assert.deepEqual(datos.paso2, null);
    assert.deepEqual(ctx.llamadas.completar, ['p_9']);
  });

  it('sin nombre usa «Usuario» como titular del perfil mínimo', async () => {
    const ctx = puertoQueConsolida();
    const r = await saltarOnboarding(ctx.puertos, undefined, 'p_1');
    assert.equal(r.ok, true);
    assert.equal(ctx.llamadas.actualizarDatos[0].datos.paso1.nombre_completo, 'Usuario');
  });
});
