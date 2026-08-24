// Suite F22 (REQ-22-02/03/06): caso de uso de cambio de perfil con un
// PUERTO FALSO. Activar otro perfil debe (a) seleccionarlo en el puerto,
// (b) fijar el titular visible de la cabecera y (c) disparar UNA recarga
// del snapshot por el flujo existente; un fallo nombrado no toca nada de
// eso (sin mezclar datos entre perfiles). Escrito ANTES del código (rojo).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cambiarPerfil } from '../../src/domain/use-cases/cambiar-perfil.ts';
import {
  PerfilInexistenteError,
  PerfilPersistenciaError,
} from '../../src/domain/errors/perfil-errors.ts';
import { perfilFalso } from './dobles.mjs';

/** Puerto falso cuyo seleccionar responde o rechaza según el guion. */
function puertoFalso(respuesta) {
  const llamadas = [];
  return {
    llamadas,
    listar: async () => [],
    activo: async () => null,
    crear: async (nombre) => perfilFalso(nombre),
    seleccionar: async (id) => {
      llamadas.push(id);
      if (typeof respuesta === 'function') return respuesta(id);
      return respuesta ?? perfilFalso('Activo');
    },
  };
}

describe('cambio de perfil feliz (REQ-22-03)', () => {
  it('selecciona el id, fija el titular y dispara la recarga del snapshot', async () => {
    const beto = perfilFalso('Beto');
    const puerto = puertoFalso(beto);
    const orden = [];
    const resultado = await cambiarPerfil(
      {
        perfiles: puerto,
        alConfirmar: (p) => orden.push(['confirmar', p]),
        alRecargar: () => orden.push(['recargar']),
      },
      beto.id,
    );
    assert.deepEqual(puerto.llamadas, [beto.id], 'selecciona el id pedido');
    assert.equal(resultado.ok, true);
    assert.deepEqual(resultado.perfil, beto);
    // El titular visible se actualiza y la recarga llega DESPUÉS de fijarlo.
    assert.deepEqual(orden, [['confirmar', beto], ['recargar']]);
  });

  it('dispara exactamente una recarga aunque se repita la selección', async () => {
    const puerto = puertoFalso(perfilFalso('Beto'));
    let recargas = 0;
    await cambiarPerfil(
      { perfiles: puerto, alConfirmar: () => {}, alRecargar: () => { recargas += 1; } },
      'p_x',
    );
    assert.equal(recargas, 1);
  });
});

describe('cambio de perfil fallido (REQ-22-06: sin mezclar datos)', () => {
  it('un id desconocido produce error nombrado SIN fijar titular ni recargar', async () => {
    const puerto = puertoFalso(() =>
      Promise.reject({ codigo: 'PerfilInexistenteError', mensaje: 'no existe' }));
    const tocados = [];
    const resultado = await cambiarPerfil(
      {
        perfiles: puerto,
        alConfirmar: () => tocados.push('confirmar'),
        alRecargar: () => tocados.push('recargar'),
      },
      'p_fantasma',
    );
    assert.equal(resultado.ok, false);
    assert.ok(resultado.error instanceof PerfilInexistenteError);
    assert.match(resultado.error.message, /no existe/);
    assert.deepEqual(tocados, [], 'nada cambia ante un fallo de selección');
  });

  it('un fallo de persistencia se reconstruye como PerfilPersistenciaError', async () => {
    const puerto = puertoFalso(() =>
      Promise.reject({ codigo: 'PerfilPersistenciaError', mensaje: 'disco lleno' }));
    const resultado = await cambiarPerfil(
      { perfiles: puerto, alConfirmar: () => {}, alRecargar: () => {} },
      'p_x',
    );
    assert.equal(resultado.ok, false);
    assert.ok(resultado.error instanceof PerfilPersistenciaError);
    assert.match(resultado.error.message, /disco lleno/);
  });
});
