// Suite F6 (4b/5): guardarRegistroMes bloquea lo inválido (REQ-06-06):
// negativos y no numéricos no llegan al puerto; fallos IPC se traducen.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { guardarRegistroMes } from '../../src/domain/use-cases/guardar-registro.ts';
import { snapshotDePrueba } from './helpers.mjs';
import { borradorBase, puertoQueRegistra } from './helpers-registro.mjs';

describe('guardarRegistroMes bloquea el guardado inválido (REQ-06-06)', () => {
  it('un importe negativo impide llamar a save y señala el campo', async () => {
    const port = puertoQueRegistra();
    const borrador = borradorBase();
    borrador.gastos.Vivienda = '-900';
    const resultado = await guardarRegistroMes(
      port,
      snapshotDePrueba(),
      borrador,
    );
    assert.equal(resultado.ok, false);
    assert.equal(port.llamadas.length, 0);
    const error = resultado.errores.find((e) => e.clave === 'gasto:Vivienda');
    assert.match(error.mensaje, /negativ/);
  });

  it('un importe no numérico también bloquea con mensaje español', async () => {
    const port = puertoQueRegistra();
    const borrador = borradorBase();
    borrador.ingresos.Salario = 'veinticinco';
    const resultado = await guardarRegistroMes(
      port,
      snapshotDePrueba(),
      borrador,
    );
    assert.equal(resultado.ok, false);
    assert.equal(port.llamadas.length, 0);
    const error = resultado.errores.find((e) => e.clave === 'ingreso:Salario');
    assert.match(error.mensaje, /numérico/);
  });

  it('un mes inválido bloquea sin tocar el puerto', async () => {
    const port = puertoQueRegistra();
    const borrador = { ...borradorBase(), mes: '2026-13' };
    const resultado = await guardarRegistroMes(
      port,
      snapshotDePrueba(),
      borrador,
    );
    assert.equal(resultado.ok, false);
    assert.equal(port.llamadas.length, 0);
    assert.match(resultado.errores[0].mensaje, /Mes inválido/i);
  });

  it('los errores de bloqueo llevan clave por campo para el inline', async () => {
    const port = puertoQueRegistra();
    const borrador = borradorBase();
    borrador.ingresos.Otros = 'n/d';
    const resultado = await guardarRegistroMes(
      port,
      snapshotDePrueba(),
      borrador,
    );
    assert.deepEqual(
      resultado.errores.map((e) => e.clave),
      ['ingreso:Otros'],
    );
  });
});

describe('fallo del backend durante el guardado (REQ-06-06)', () => {
  it('traduce el rechazo IPC a aviso global con motivo en español', async () => {
    const port = puertoQueRegistra(async () => {
      throw { codigo: 'SnapshotSaveError', mensaje: 'disco lleno' };
    });
    const resultado = await guardarRegistroMes(
      port,
      snapshotDePrueba(),
      borradorBase(),
    );
    assert.equal(resultado.ok, false);
    const global = resultado.errores.find((e) => e.clave === '__guardado__');
    assert.match(global.mensaje, /No se pudo guardar/);
    assert.ok(global.mensaje.includes('disco lleno'));
  });
});
