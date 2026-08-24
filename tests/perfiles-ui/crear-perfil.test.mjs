// Suite F22 (REQ-22-04/05): alta de perfil nuevo validada en el caso de
// uso con PUERTO FALSO: nombre vacío o ya existente muestra el mensaje
// en español SIN llamar jamás al puerto (sin crear nada); un nombre
// válido se recorta y se da de alta. Escrito ANTES del código (rojo).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  avisoNombreDuplicado,
  crearPerfil,
} from '../../src/domain/use-cases/crear-perfil.ts';
import { perfilFalso } from './dobles.mjs';

function puertoQueGraba() {
  const creados = [];
  return {
    creados,
    listar: async () => [],
    activo: async () => null,
    crear: async (nombre) => {
      creados.push(nombre);
      return perfilFalso(nombre);
    },
    seleccionar: async (id) => perfilFalso('x', id),
  };
}

describe('alta con nombre inválido (REQ-22-05)', () => {
  for (const vacio of ['', '   ']) {
    it(`rechaza «${vacio}» sin llamar al puerto`, async () => {
      const puerto = puertoQueGraba();
      const resultado = await crearPerfil(puerto, vacio, []);
      assert.equal(resultado.ok, false);
      assert.match(resultado.aviso, /no puede estar vacío/);
      assert.deepEqual(puerto.creados, [], 'nada se crea con nombre vacío');
    });
  }

  it('un duplicado local produce el mensaje en español sin crear nada', async () => {
    const puerto = puertoQueGraba();
    const existentes = [perfilFalso('Ana'), perfilFalso('Beto')];
    const resultado = await crearPerfil(puerto, 'Ana', existentes);
    assert.equal(resultado.ok, false);
    assert.match(resultado.aviso, /ya existe un perfil llamado «Ana»/);
    assert.deepEqual(puerto.creados, []);
  });

  it('el recorte del nombre también detecta el duplicado', async () => {
    const resultado = await crearPerfil(puertoQueGraba(), '  Ana ', [
      perfilFalso('Ana'),
    ]);
    assert.equal(resultado.ok, false);
    assert.equal(resultado.aviso, avisoNombreDuplicado('Ana'));
  });
});

describe('alta feliz (REQ-22-04)', () => {
  it('da de alta el nombre recortado por el puerto', async () => {
    const puerto = puertoQueGraba();
    const resultado = await crearPerfil(puerto, '  Beto ', [perfilFalso('Ana')]);
    assert.equal(resultado.ok, true);
    assert.equal(resultado.perfil.nombre, 'Beto');
    assert.deepEqual(puerto.creados, ['Beto']);
  });

  it('un rechazo del backend (duplicado en carrera) llega como aviso español', async () => {
    const puerto = puertoQueGraba();
    puerto.crear = () =>
      Promise.reject({
        codigo: 'PerfilNombreDuplicadoError',
        mensaje: 'ya existe un perfil llamado «Ana»',
      });
    const resultado = await crearPerfil(puerto, 'Ana', []);
    assert.equal(resultado.ok, false);
    assert.match(resultado.aviso, /ya existe un perfil llamado «Ana»/);
  });
});
