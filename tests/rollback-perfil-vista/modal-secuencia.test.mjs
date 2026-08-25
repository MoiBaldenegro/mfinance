import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { capturarContexto, ejecutarCambioPerfil } from '../../src/domain/use-cases/rollback-perfil-vista.ts';

const anterior = { id: 'p-ana', nombre: 'Ana', creado_en: '2026-01-01' };
const objetivo = { id: 'p-beto', nombre: 'Beto', creado_en: '2026-01-02' };

function escenario() {
  const eventos = [];
  let cargas = 0;
  const deps = {
    perfilPort: { seleccionar: async (id) => {
      eventos.push(['seleccionar', id]); return id === objetivo.id ? objetivo : anterior;
    } },
    cargarSnapshot: async () => {
      cargas += 1;
      eventos.push(['cargar', cargas]);
      return cargas === 1
        ? { generacion: 1, resultado: { ok: false, error: new Error('snapshot ilegible') } }
        : { generacion: 2, resultado: { ok: true, datos: {} } };
    },
    esCargaVigente: () => true, generacionActual: () => cargas,
    publicarSnapshot: (_, commit) => { commit(); eventos.push(['publicar']); return true; },
    contexto: capturarContexto(anterior.id, 'balance'), objetivoId: objetivo.id,
    alIniciar: () => eventos.push(['iniciar']), alFase: () => eventos.push(['rollback']),
    alFinalizar: () => eventos.push(['finalizar']), alConfirmar: (perfil) => eventos.push(['confirmar', perfil.id]),
    alRestaurarVista: (vista) => eventos.push(['vista', vista]), alError: () => {}, alCancelar: () => {},
  };
  return { deps, eventos, get cargas() { return cargas; } };
}

describe('confirmación del rollback tras fallo objetivo', () => {
  it('deja el fallo pendiente y no inicia rollback hasta confirmación', async () => {
    const flujo = escenario();
    const resultado = await ejecutarCambioPerfil(flujo.deps);
    assert.equal(resultado.ok, false);
    assert.equal(resultado.fase, 'snapshot-nuevo-pendiente');
    assert.equal(resultado.perfil.nombre, 'Beto');
    assert.deepEqual(flujo.eventos, [['seleccionar', 'p-beto'], ['iniciar'], ['cargar', 1]]);
    await resultado.rollback();
    assert.deepEqual(flujo.eventos, [
      ['seleccionar', 'p-beto'], ['iniciar'], ['cargar', 1], ['iniciar'], ['rollback'],
      ['seleccionar', 'p-ana'], ['cargar', 2], ['confirmar', 'p-ana'], ['vista', 'balance'],
      ['publicar'], ['finalizar'],
    ]);
    await resultado.rollback();
    assert.equal(flujo.cargas, 2);
  });
  it('permite una nueva recuperación tras un rechazo inesperado del rollback', async () => {
    const flujo = escenario(); let publicaciones = 0;
    flujo.deps.publicarSnapshot = (_, commit) => {
      if (++publicaciones === 1) throw new Error('publicador rechazado');
      commit(); return true;
    };
    const pendiente = await ejecutarCambioPerfil(flujo.deps);
    await assert.rejects(pendiente.rollback(), /publicador rechazado/);
    const recuperado = await pendiente.rollback();
    assert.equal(recuperado.ok, true);
    assert.deepEqual(flujo.eventos.filter(([tipo]) => tipo === 'seleccionar'), [
      ['seleccionar', 'p-beto'], ['seleccionar', 'p-ana'], ['seleccionar', 'p-ana'],
    ]);
    assert.equal(flujo.cargas, 3);
  });
});
