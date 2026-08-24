// Suite F6 (4a/5): guardarRegistroMes persiste vía puerto IPC
// (REQ-06-04): save llamado con el snapshot actualizado y sin ruido.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { guardarRegistroMes } from '../../src/domain/use-cases/guardar-registro.ts';
import { snapshotDePrueba } from './helpers.mjs';
import { borradorBase, puertoQueRegistra } from './helpers-registro.mjs';

describe('guardarRegistroMes persiste vía puerto IPC (REQ-06-04)', () => {
  it('llama a save una vez con el snapshot que incluye el mes guardado', async () => {
    const port = puertoQueRegistra();
    const resultado = await guardarRegistroMes(
      port,
      snapshotDePrueba(),
      borradorBase(),
    );
    assert.equal(resultado.ok, true);
    assert.equal(port.llamadas.length, 1);
    const septiembre = resultado.snapshot.monthly_records.find(
      (r) => r.mes === '2026-09',
    );
    assert.deepEqual(septiembre.ingresos, { Salario: 2600, Arriendos: 650 });
    assert.deepEqual(septiembre.gastos, { Vivienda: 900, Alimentacion: 350.25 });
  });

  it('omite las entradas vacías o cero del registro enviado', async () => {
    const port = puertoQueRegistra();
    const borrador = borradorBase();
    borrador.ingresos.Arriendos = '';
    borrador.gastos.Vivienda = '0';
    const resultado = await guardarRegistroMes(
      port,
      snapshotDePrueba(),
      borrador,
    );
    const septiembre = resultado.snapshot.monthly_records.find(
      (r) => r.mes === '2026-09',
    );
    assert.equal(septiembre.ingresos.Arriendos, undefined);
    assert.equal(septiembre.gastos.Vivienda, undefined);
  });

  it('actualiza un mes ya registrado sin duplicarlo (upsert)', async () => {
    const port = puertoQueRegistra();
    const borrador = { ...borradorBase(), mes: '2026-08' };
    const resultado = await guardarRegistroMes(
      port,
      snapshotDePrueba(),
      borrador,
    );
    const agosto = resultado.snapshot.monthly_records.filter(
      (r) => r.mes === '2026-08',
    );
    assert.equal(agosto.length, 1);
    assert.deepEqual(agosto[0].ingresos, { Salario: 2600, Arriendos: 650 });
  });

  it('no muta el snapshot original recibido (inmutabilidad)', async () => {
    const port = puertoQueRegistra();
    const original = snapshotDePrueba();
    await guardarRegistroMes(port, original, borradorBase());
    assert.ok(!original.monthly_records.some((r) => r.mes === '2026-09'));
  });
});
