// F38 ronda 2: rollback único, respuesta obsoleta y recuperación explícita.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { capturarContexto, ejecutarCambioPerfil } from '../../src/domain/use-cases/rollback-perfil-vista.ts';
import { crearGuardiaGeneracion, publicarSiVigente } from '../../src/domain/use-cases/snapshot-generacion.ts';
const anterior = { id: 'p-ana', nombre: 'Ana', creado_en: '2026-01-01' };
const nuevo = { id: 'p-beto', nombre: 'Beto', creado_en: '2026-01-02' };
function base(extra = {}) {
  const llamadas = [];
  let retry;
  const d = {
    llamadas,
    perfilPort: { seleccionar: async (id) => {
      llamadas.push(['seleccionar', id]); return id === nuevo.id ? nuevo : anterior;
    } },
    cargarSnapshot: async () => ({ generacion: 1, resultado: { ok: true, datos: {} } }),
    esCargaVigente: () => true, generacionActual: () => 1,
    publicarSnapshot: (_, commit) => { commit(); return true; },
    contexto: capturarContexto(anterior.id, 'pyg'), objetivoId: nuevo.id,
    alIniciar: () => {}, alFase: () => {}, alFinalizar: () => {}, alConfirmar: () => {},
    alRestaurarVista: () => {}, alError: (fase, error, generacion, accion) => { retry = accion; llamadas.push(['error', fase, error.message, generacion]); },
    alCancelar: () => {},
    ...extra,
  };
  Object.defineProperty(d, 'retry', { get: () => retry });
  return d;
}
describe('fallos del rollback y respuestas obsoletas', () => {
  it('conserva el fallo original aunque la restauración termine bien', async () => {
    const d = base({ cargarSnapshot: (() => {
      let n = 0;
      return async () => ({ generacion: ++n, resultado: n === 1
        ? { ok: false, error: new Error('snapshot nuevo ilegible') }
        : { ok: true, datos: {} } });
    })() });
    const pendiente = await ejecutarCambioPerfil(d);
    assert.equal(pendiente.ok, false);
    assert.equal(pendiente.fase, 'snapshot-nuevo-pendiente');
    assert.match(pendiente.error.message, /snapshot nuevo/);
    const resultado = await pendiente.rollback();
    assert.equal(resultado.ok, true);
  });
  it('ejecuta una única reversión y diagnostica su selección fallida', async () => {
    const d = base({
      perfilPort: { seleccionar: async (id) => {
        d.llamadas.push(['seleccionar', id]);
        if (id === anterior.id) throw new Error('anterior no disponible');
        return nuevo;
      } },
      cargarSnapshot: async () => ({ generacion: 1, resultado: { ok: false, error: new Error('nuevo roto') } }),
    });
    const pendiente = await ejecutarCambioPerfil(d);
    const resultado = await pendiente.rollback();
    assert.equal(resultado.ok, false);
    assert.equal(resultado.fase, 'rollback-seleccion');
    assert.deepEqual(d.llamadas.slice(0, 2), [['seleccionar', nuevo.id], ['seleccionar', anterior.id]]);
    assert.equal(d.retry !== undefined, true);
  });
  it('una carga obsoleta no dispara rollback ni publica datos', async () => {
    const d = base({
      esCargaVigente: () => false,
      publicarSnapshot: () => { throw new Error('no debe publicar'); },
    });
    const resultado = await ejecutarCambioPerfil(d);
    assert.equal(resultado.ok, false);
    assert.equal(resultado.fase, 'obsoleta');
    assert.deepEqual(d.llamadas, [['seleccionar', nuevo.id]]);
  });
  it('descarta una respuesta tardía real después de iniciar otra generación', async () => {
    const guardia = crearGuardiaGeneracion();
    const primera = guardia.iniciar();
    let resolver;
    const respuesta = new Promise((resolve) => { resolver = resolve; });
    const segunda = guardia.iniciar();
    resolver({ generacion: primera, datos: 'obsoletos' });
    const carga = await respuesta;
    const visibles = [];
    assert.equal(publicarSiVigente(guardia, carga.generacion, () => visibles.push(carga.datos)), false);
    assert.equal(publicarSiVigente(guardia, segunda, () => visibles.push('vigente')), true);
    assert.deepEqual(visibles, ['vigente']);
  });
  it('Reintentar recupera la fase anterior sin volver a seleccionar el objetivo', async () => {
    let anteriores = 0;
    let retry;
    const d = base({
      perfilPort: { seleccionar: async (id) => {
        d.llamadas.push(['seleccionar', id]);
        if (id === anterior.id && ++anteriores === 1) throw new Error('transitorio');
        return id === nuevo.id ? nuevo : anterior;
      } },
      cargarSnapshot: (() => { let n = 0; return async () => ({ generacion: ++n,
        resultado: n === 1 ? { ok: false, error: new Error('nuevo roto') } : { ok: true, datos: {} } }); })(),
      alError: (_, __, ___, accion) => { retry = accion; },
    });
    const pendiente = await ejecutarCambioPerfil(d);
    await pendiente.rollback();
    await retry();
    assert.deepEqual(d.llamadas, [['seleccionar', nuevo.id], ['seleccionar', anterior.id], ['seleccionar', anterior.id]]);
  });
});
