// Suite F8: estado vacío de la sección Balance (REQ-08-05)
// muestra mensaje en español invitando a crear el primer activo/pasivo.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  estaVacio,
  MENSAJE_SIN_PATRIMONIO,
} from '../../src/domain/use-cases/balance-vacio.ts';

const SERIE_VACIA = { filas: [] };
const SERIE_CON_DATOS = {
  filas: [{ mes: '2026-01', activos: 1000, pasivos: 500, patrimonio: 500 }],
};

describe('estado vacío Balance (REQ-08-05)', () => {
  it('serie sin filas se detecta vacía', () => {
    assert.equal(estaVacio(SERIE_VACIA), true);
    assert.equal(estaVacio(SERIE_CON_DATOS), false);
  });

  it('mensaje en español invitando a crear primer activo o pasivo', () => {
    assert.ok(MENSAJE_SIN_PATRIMONIO.includes('activo') || MENSAJE_SIN_PATRIMONIO.includes('pasivo'));
    assert.ok(MENSAJE_SIN_PATRIMONIO.length > 20);
  });
});