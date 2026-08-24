// Suite F12 (frontend, 2/2): acciones fila a fila y resumen del informe
// (REQ-12-10/11 + REQ-12-13..17). El journey con adapter fake vive en
// diagnostico-puerto.test.mjs.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { crearFilas } from '../../src/domain/use-cases/diagnostico-tabla.ts';
import {
  aceptadosDeFilas,
  confirmarFila,
  descartarFila,
  editarFila,
  reabrirFila,
  resumenFilas,
} from '../../src/domain/use-cases/diagnostico-tabla-acciones.ts';
import { resumenLote } from '../../src/domain/use-cases/diagnostico-informe-resumen.ts';
import { INFORME } from './diagnostico-informe.mjs';

describe('acciones fila a fila (REQ-12-10/11)', () => {
  it('confirmar exige categoría del catálogo cerrado', () => {
    const filas = crearFilas(INFORME);
    const negadas = confirmarFila(filas, filas[0].id);
    assert.equal(negadas[0].estado, 'pendiente', 'sin categoría no confirma');
    const conCategoria = editarFila(negadas, negadas[0].id, {
      categoria: 'Alimentacion',
    });
    const confirmadas = confirmarFila(conCategoria, conCategoria[0].id);
    assert.equal(confirmadas[0].estado, 'confirmada');
  });

  it('descartar y reabrir cambian el estado de la fila indicada', () => {
    let filas = crearFilas(INFORME);
    filas = descartarFila(filas, filas[1].id);
    assert.equal(filas[1].estado, 'descartada');
    filas = reabrirFila(filas, filas[1].id);
    assert.equal(filas[1].estado, 'pendiente');
    // Inmutabilidad: las demás filas no cambian.
    assert.equal(filas[0].estado, 'pendiente');
  });

  it('editar cambia solo la fila pedida sin mutar el array original', () => {
    const filas = crearFilas(INFORME);
    const editadas = editarFila(filas, filas[2].id, { importe: -30.0 });
    assert.equal(editadas[2].importe, -30.0);
    assert.equal(filas[2].importe, -23.75);
    assert.deepEqual(
      editadas.filter((fila, indice) => indice !== 2),
      filas.filter((fila, indice) => indice !== 2),
    );
  });

  it('resumenFilas cuenta pendientes confirmadas y descartadas', () => {
    let filas = crearFilas(INFORME);
    filas = editarFila(filas, filas[0].id, { categoria: 'Alimentacion' });
    filas = confirmarFila(filas, filas[0].id);
    filas = descartarFila(filas, filas[1].id);
    assert.deepEqual(resumenFilas(filas), {
      pendientes: 1,
      confirmadas: 1,
      descartadas: 1,
      total: 3,
    });
  });

  it('aceptadosDeFilas mapea solo las confirmadas al DTO del backend', () => {
    let filas = crearFilas(INFORME);
    filas = editarFila(filas, filas[0].id, { categoria: 'Alimentacion' });
    filas = confirmarFila(filas, filas[0].id);
    assert.deepEqual(aceptadosDeFilas(filas), [
      {
        movimiento: {
          fecha: '2026-06-01',
          comercio: 'SUPERMERCADO ACME',
          importe: -45.3,
        },
        categoria: 'Alimentacion',
      },
    ]);
  });
});

describe('resumenLote (REQ-12-13..17)', () => {
  it('cuenta los estados por archivo sin bloquear la revisión', () => {
    assert.deepEqual(resumenLote(INFORME), {
      total: 2,
      analizados: 1,
      ilegibles: 0,
      corruptos: 1,
      fallidos: 0,
      conCoherencia: 1,
    });
  });
});
