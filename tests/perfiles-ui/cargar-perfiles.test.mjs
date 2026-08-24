// Suite F22 (REQ-22-01/06): carga inicial del registro de perfiles para
// la UI y reconstrucción de errores nombrados desde los códigos IPC del
// backend. Escrito ANTES del código (rojo).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cargarPerfiles } from '../../src/domain/use-cases/cargar-perfiles.ts';
import {
  errorPerfilDesdeRechazo,
  PerfilInexistenteError,
  PerfilNombreDuplicadoError,
  PerfilNombreVacioError,
  PerfilPersistenciaError,
  PerfilRegistroCorruptoError,
} from '../../src/domain/errors/perfil-errors.ts';
import { perfilFalso } from './dobles.mjs';

describe('carga del registro de perfiles (REQ-22-01)', () => {
  it('devuelve la lista y el activo del puerto', async () => {
    const ana = perfilFalso('Ana');
    const beto = perfilFalso('Beto');
    const puerto = {
      listar: async () => [ana, beto],
      activo: async () => beto,
      crear: async () => ana,
      seleccionar: async () => beto,
    };
    const resultado = await cargarPerfiles(puerto);
    assert.equal(resultado.ok, true);
    assert.deepEqual(resultado.perfiles, [ana, beto]);
    assert.deepEqual(resultado.activo, beto);
  });

  it('sin perfiles activos devuelve null sin error', async () => {
    const resultado = await cargarPerfiles({
      listar: async () => [],
      activo: async () => null,
    });
    assert.equal(resultado.ok, true);
    assert.deepEqual(resultado.perfiles, []);
    assert.equal(resultado.activo, null);
  });

  it('un registro corrupto produce error nombrado en español (REQ-22-06)', async () => {
    const resultado = await cargarPerfiles({
      listar: () =>
        Promise.reject({
          codigo: 'PerfilRegistroCorruptoError',
          mensaje: 'el registro de perfiles está corrupto: JSON roto',
        }),
      activo: async () => null,
    });
    assert.equal(resultado.ok, false);
    assert.ok(resultado.error instanceof PerfilRegistroCorruptoError);
    assert.match(resultado.error.message, /corrupto/);
  });
});

describe('reconstrucción de errores nombrados desde códigos IPC', () => {
  it('mapea los cinco códigos del backend a sus clases', () => {
    assert.ok(
      errorPerfilDesdeRechazo({ codigo: 'PerfilNombreVacioError', mensaje: 'm' })
        instanceof PerfilNombreVacioError,
    );
    assert.ok(
      errorPerfilDesdeRechazo({ codigo: 'PerfilNombreDuplicadoError', mensaje: 'd' })
        instanceof PerfilNombreDuplicadoError,
    );
    assert.ok(
      errorPerfilDesdeRechazo({ codigo: 'PerfilRegistroCorruptoError', mensaje: 'c' })
        instanceof PerfilRegistroCorruptoError,
    );
    assert.ok(
      errorPerfilDesdeRechazo({ codigo: 'PerfilInexistenteError', mensaje: 'i' })
        instanceof PerfilInexistenteError,
    );
    assert.ok(
      errorPerfilDesdeRechazo({ codigo: 'PerfilPersistenciaError', mensaje: 'p' })
        instanceof PerfilPersistenciaError,
    );
  });

  it('un código desconocido cae en PerfilPersistenciaError con el motivo', () => {
    const error = errorPerfilDesdeRechazo({ codigo: 'RaroError', mensaje: 'ups' });
    assert.ok(error instanceof PerfilPersistenciaError);
    assert.match(error.message, /ups/);
  });
});
