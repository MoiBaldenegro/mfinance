// REQ-27-03/10: caso de uso gestionarMetas — CRUD del journal vía
// puerto con validación previa; errores técnicos como avisos español.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  agregarMeta,
  actualizarMeta,
  eliminarMeta,
} from '../../src/domain/use-cases/onboarding/gestionar-metas.ts';

function entradaValida(overrides = {}) {
  return {
    titulo: overrides.titulo ?? 'Comprar casa',
    descripcion: overrides.descripcion ?? 'Entrada del 20% en 5 años',
    tags: overrides.tags ?? ['casa', 'ahorro'],
  };
}

function puertoFalso() {
  const llamadas = { agregar: 0, actualizar: 0, eliminar: 0 };
  const journal = [];
  const onboarding = {
    obtenerEstado: async () => ({ nombre: 'Completed' }),
    actualizarDatos: async () => {},
    completarOnboarding: async () => ({}),
    agregarMeta: async (_perfilId, entrada) => {
      llamadas.agregar++;
      const meta = { id: `g_${llamadas.agregar}`, creado_en: '2026-08-23T00:00:00Z', ...entrada };
      journal.push(meta);
      return meta;
    },
    actualizarMeta: async (_perfilId, metaId, entrada) => {
      llamadas.actualizar++;
      return { id: metaId, creado_en: '2026-08-23T00:00:00Z', ...entrada };
    },
    eliminarMeta: async (_perfilId, metaId) => {
      llamadas.eliminar++;
      const idx = journal.findIndex((m) => m.id === metaId);
      if (idx === -1) throw { mensaje: 'meta no encontrada' };
      journal.splice(idx, 1);
    },
  };
  return { puertos: { onboarding }, llamadas, journal };
}

describe('gestionarMetas — CRUD vía puerto (REQ-27-03/10)', () => {
  it('agregarMeta valida antes de llamar al puerto y devuelve la meta', async () => {
    const ctx = puertoFalso();
    const mala = await agregarMeta(ctx.puertos, 'p_1', entradaValida({ titulo: '' }));
    assert.equal(mala.ok, false);
    assert.equal(ctx.llamadas.agregar, 0, 'puerto no llamado si es inválida');
    assert.ok(Array.isArray(mala.avisos) && mala.avisos.length > 0);
    const buena = await agregarMeta(ctx.puertos, 'p_1', entradaValida());
    assert.equal(buena.ok, true);
    assert.equal(buena.meta.titulo, 'Comprar casa');
    assert.equal(ctx.journal.length, 1);
  });

  it('actualizarMeta delega conservando id tras validar', async () => {
    const ctx = puertoFalso();
    const r = await actualizarMeta(ctx.puertos, 'p_1', 'g_9', entradaValida({ titulo: 'Jubilación' }));
    assert.equal(r.ok, true);
    assert.equal(r.meta.id, 'g_9');
    assert.equal(r.meta.titulo, 'Jubilación');
    assert.equal(ctx.llamadas.actualizar, 1);
  });

  it('eliminarMeta delega y propaga error nombrado en español', async () => {
    const ctx = puertoFalso();
    await agregarMeta(ctx.puertos, 'p_1', entradaValida());
    assert.deepEqual(await eliminarMeta(ctx.puertos, 'p_1', 'g_1'), { ok: true });
    const fallo = await eliminarMeta(ctx.puertos, 'p_1', 'g_1');
    assert.equal(fallo.ok, false);
    assert.match(fallo.aviso, /meta no encontrada/);
    assert.equal(ctx.llamadas.eliminar, 2);
  });

  it('fallo técnico del puerto produce aviso sin lanzar', async () => {
    const puertos = {
      onboarding: {
        obtenerEstado: async () => ({}), actualizarDatos: async () => {},
        completarOnboarding: async () => ({}),
        agregarMeta: async () => { throw new Error('IPC caído'); },
        actualizarMeta: async () => ({}), eliminarMeta: async () => {},
      },
    };
    const r = await agregarMeta(puertos, 'p_1', entradaValida());
    assert.equal(r.ok, false);
    assert.match(r.aviso, /no se pudo guardar la meta/);
  });
});
