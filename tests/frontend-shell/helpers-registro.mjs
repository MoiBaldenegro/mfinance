// Helpers compartidos de las suites F6 de guardado (patrón F5): puerto
// falso que registra los save recibidos y borrador base del formulario.
// Este archivo NO es descubierto por node --test (no casa *.test.mjs).
import { snapshotDePrueba } from './helpers.mjs';

/** Puerto falso con contador de llamadas y fallo inyectable. */
export function puertoQueRegistra(implSave) {
  const llamadas = [];
  return {
    llamadas,
    async load() {
      throw new Error('no usado en esta suite');
    },
    async save(snapshot) {
      llamadas.push(snapshot);
      if (implSave) await implSave(snapshot);
    },
    async export(destination) {
      return destination;
    },
    async import() {
      return snapshotDePrueba();
    },
  };
}

/** Borrador realista: textos tal cual los dejaría el formulario. */
export function borradorBase() {
  return {
    mes: '2026-09',
    ingresos: { Salario: '2600', Freelance: '', Arriendos: '650', Otros: '' },
    gastos: {
      Vivienda: '900',
      Alimentacion: '350,25',
      Transporte: '',
      CuotasDeuda: '',
      Ocio: '',
      Otros: '',
    },
  };
}
