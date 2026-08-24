// Suite F12 (frontend, 3/3): contrato del puerto DiagnosticoPort con un
// adapter FAKE en memoria — journey completo subir → analizar → revisar
// → confirmar sin React ni IPC real (REQ-12-09). Las reglas del hexágono
// y el mapeo de errores nombrados viven en diagnostico-hexagono.test.mjs.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { crearFilas } from '../../src/domain/use-cases/diagnostico-tabla.ts';
import {
  aceptadosDeFilas,
  confirmarFila,
  descartarFila,
  editarFila,
} from '../../src/domain/use-cases/diagnostico-tabla-acciones.ts';
import { SNAPSHOT_VACIO } from '../../src/domain/entities/finance-snapshot.ts';
import { INFORME } from './diagnostico-informe.mjs';

/** Adapter fake: espejo en memoria del comportamiento del backend. */
class PuertoFalso {
  subidos = new Map();
  snapshot = SNAPSHOT_VACIO;

  async subirComprobantes(mes, archivos) {
    for (const a of archivos) this.subidos.set(`${mes}/${a.nombre}`, 1);
    return archivos.map((a) => a.nombre);
  }

  async diagnosticar(mes) {
    assert.equal(mes, '2026-06');
    return INFORME;
  }

  async confirmar(mes, aceptados) {
    const gastos = {};
    for (const aceptado of aceptados) {
      const clave = aceptado.categoria;
      gastos[clave] = (gastos[clave] ?? 0)
        + Math.abs(aceptado.movimiento.importe);
    }
    this.snapshot = {
      ...SNAPSHOT_VACIO,
      monthly_records: [{ mes, ingresos: {}, gastos }],
    };
    return this.snapshot;
  }
}

describe('journey con puerto fake (REQ-12-09)', () => {
  it('subir → analizar → revisar → confirmar actualiza el mes', async () => {
    const puerto = new PuertoFalso();
    const subidos = [
      { nombre: 'extracto.pdf', contenidoBase64: 'JVBERi0=' },
      { nombre: 'roto.pdf', contenidoBase64: 'YmFzdXJh' },
    ];
    await puerto.subirComprobantes('2026-06', subidos);
    assert.equal(puerto.subidos.size, 2);

    const informe = await puerto.diagnosticar('2026-06');
    const filas = crearFilas(informe);
    assert.ok(filas.length > 0);
    // Confirmamos el supermercado como Alimentación y descartamos la nómina.
    let actuales = editarFila(filas, filas[0].id, { categoria: 'Alimentacion' });
    actuales = confirmarFila(actuales, actuales[0].id);
    actuales = descartarFila(actuales, actuales[1].id);
    const aceptados = aceptadosDeFilas(actuales);
    assert.equal(aceptados.length, 1);

    const snapshot = await puerto.confirmar('2026-06', aceptados);
    assert.deepEqual(snapshot.monthly_records[0].gastos, { Alimentacion: 45.3 });
  });
});
