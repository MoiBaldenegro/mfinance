import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { capturarContexto, ejecutarCambioPerfil } from '../../src/domain/use-cases/rollback-perfil-vista.ts';
import { crearGuardiaGeneracion, crearPublicadorEstado } from '../../src/domain/use-cases/snapshot-generacion.ts';
const ana = { id: 'p-ana', nombre: 'Ana', creado_en: '2026-01-01' };
const beto = { id: 'p-beto', nombre: 'Beto', creado_en: '2026-01-02' };
function doble(extra = {}) {
  const eventos = [];
  let generacion = 1;
  return {
    eventos,
    perfilPort: { seleccionar: async (id) => {
      eventos.push(['seleccionar', id]); return id === beto.id ? beto : ana;
    } },
    cargarSnapshot: async () => ({ generacion, resultado: { ok: true, datos: {} } }),
    esCargaVigente: () => true, generacionActual: () => generacion,
    publicarSnapshot: (carga, commit) => { commit(); eventos.push(['publicar', carga.generacion]); return true; },
    contexto: capturarContexto(ana.id, 'balance'), objetivoId: beto.id,
    alIniciar: () => eventos.push(['iniciar']), alFase: () => eventos.push(['rollback']),
    alFinalizar: () => eventos.push(['finalizar']), alConfirmar: (p) => eventos.push(['confirmar', p.id]),
    alRestaurarVista: (s) => eventos.push(['vista', s]),
    alError: () => {}, alCancelar: () => eventos.push(['cancelar']),
    ...extra,
  };
}
describe('captura y publicación transaccional', () => {
  it('captura id y sección de forma inmutable', () => {
    const contexto = capturarContexto(ana.id, 'diagnostico');
    assert.deepEqual(contexto, { perfilId: ana.id, seccion: 'diagnostico' });
    assert.equal(Object.isFrozen(contexto), true);
  });
  it('conserva el camino feliz y confirma antes de publicar el snapshot nuevo', async () => {
    const d = doble();
    const resultado = await ejecutarCambioPerfil(d);
    assert.equal(resultado.ok, true);
    assert.deepEqual(d.eventos, [
      ['seleccionar', beto.id], ['iniciar'], ['confirmar', beto.id],
      ['publicar', 1], ['finalizar'],
    ]);
  });
  it('publica solo tras confirmar y restaurar la vista anterior', async () => {
    const d = doble({
      cargarSnapshot: (() => {
        let intento = 0;
        return async () => {
          if (++intento === 1) return { generacion: 1, resultado: { ok: false, error: new Error('nuevo roto') } };
          return { generacion: 2, resultado: { ok: true, datos: {} } };
        };
      })(),
    });
    const pendiente = await ejecutarCambioPerfil(d);
    assert.equal(pendiente.ok, false);
    assert.equal(pendiente.fase, 'snapshot-nuevo-pendiente');
    const resultado = await pendiente.rollback();
    assert.equal(resultado.ok, true);
    assert.deepEqual(d.eventos, [
      ['seleccionar', beto.id], ['iniciar'], ['iniciar'], ['rollback'],
      ['seleccionar', ana.id], ['confirmar', ana.id], ['vista', 'balance'],
      ['publicar', 2], ['finalizar'],
    ]);
  });
  it('no confirma ningún perfil si la publicación queda obsoleta', async () => {
    const confirmados = [];
    const d = doble({ publicarSnapshot: () => false, alConfirmar: (p) => confirmados.push(p.id) });
    const resultado = await ejecutarCambioPerfil(d);
    assert.equal(resultado.ok, false);
    assert.equal(resultado.fase, 'obsoleta');
    assert.deepEqual(confirmados, []);
  });
  it('no recupera si publicar el snapshot anterior queda obsoleto', async () => {
    const estado = { perfil: beto.id, vista: 'pyg', recuperacion: false };
    const guardia = crearGuardiaGeneracion();
    const generacionInicial = guardia.iniciar();
    const publicador = crearPublicadorEstado(guardia, () => {});
    let comprobaciones = 0;
    let compromisos = 0;
    const d = doble({
      cargarSnapshot: (() => {
        let intento = 0;
        return async () => (++intento === 1
          ? { generacion: 1, resultado: { ok: false, error: new Error('nuevo roto') } }
          : { generacion: generacionInicial, resultado: { ok: true, datos: { snapshot: 'anterior' } } });
      })(),
      esCargaVigente: (generacion) => {
        const vigente = guardia.esVigente(generacion);
        if (++comprobaciones === 2) guardia.iniciar();
        return vigente;
      },
      generacionActual: () => guardia.actual(),
      alConfirmar: (p) => { estado.perfil = p.id; },
      alRestaurarVista: (s) => { estado.vista = s; },
      publicarSnapshot: (carga, commit) => publicador.publicarComprometido(
        carga.generacion, {}, () => { compromisos += 1; commit(); }),
    });
    const pendiente = await ejecutarCambioPerfil(d);
    const resultado = await pendiente.rollback();
    assert.equal(resultado.ok, false);
    assert.equal(resultado.fase, 'obsoleta');
    assert.equal(resultado.recuperado, undefined);
    assert.equal(compromisos, 0);
    assert.deepEqual(estado, { perfil: beto.id, vista: 'pyg', recuperacion: false });
  });
});
