// F38 ronda 4: controlador extraído del SnapshotProvider ante respuestas tardías.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SnapshotLoadError } from '../../src/domain/errors/snapshot-errors.ts';
import { crearControladorSnapshot } from '../../src/domain/use-cases/snapshot-provider-controller.ts';

describe('SnapshotProvider — respuestas obsoletas', () => {
  it('descarta en el controlador real una respuesta tardía sin resucitar shell', async () => {
    const visibles = [];
    const shell = [];
    const commits = [];
    const estados = (resultado) => resultado.ok
      ? { nombre: 'listo', snapshot: resultado.datos.snapshot }
      : { nombre: 'error', error: resultado.error };
    const controlador = crearControladorSnapshot(
      { obtenerPerfilActivoConOnboarding: () => respuestas.shift() },
      estados,
      (snapshot) => ({ nombre: 'listo', snapshot }),
      (estado) => { visibles.push(estado); if (estado.nombre === 'listo') shell.push(estado.snapshot); },
      { nombre: 'cargando' },
    );
    let resolverVieja;
    let resolverNueva;
    const respuestas = [
      new Promise((resolve) => { resolverVieja = resolve; }),
      new Promise((resolve) => { resolverNueva = resolve; }),
    ];
    const vieja = controlador.solicitar(true);
    const nueva = controlador.solicitar(true);
    resolverNueva({ snapshot: 'nuevo', onboarding_status: { nombre: 'Completed' } });
    const cargaNueva = await nueva;
    resolverVieja({ snapshot: 'viejo', onboarding_status: { nombre: 'Completed' } });
    const cargaVieja = await vieja;
    assert.equal(cargaVieja.resultado.ok, true);
    assert.equal(cargaNueva.resultado.ok, true);
    assert.equal(controlador.mostrarError(new SnapshotLoadError('viejo'), cargaVieja.generacion), false);
    const publicacionesAntesDeAplicar = visibles.length;
    assert.equal(controlador.aplicarSnapshot({ id: 'viejo' }, cargaVieja.generacion), false);
    assert.equal(controlador.publicarSnapshot(cargaVieja, () => commits.push('viejo')), false);
    assert.deepEqual(commits, []);
    assert.deepEqual(shell, ['nuevo']);
    assert.equal(visibles.length, publicacionesAntesDeAplicar);
    assert.doesNotMatch(JSON.stringify(visibles), /viejo/);
    assert.equal(controlador.aplicarSnapshot({ id: 'nuevo' }, cargaNueva.generacion), true);
    assert.deepEqual(visibles.at(-1), { nombre: 'listo', snapshot: { id: 'nuevo' } });
  });
});
