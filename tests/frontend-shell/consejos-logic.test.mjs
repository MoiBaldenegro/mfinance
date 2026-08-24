// Suite feature 16 (3/5): consejos continuos (REQ-16-04/05): carga vía
// puerto, límite de visibles del design.md y mapeo de severidad a tokens.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CONSEJOS_INICIALES,
  cargarConsejos,
  visibles,
  claseSeveridad,
} from '../../src/domain/use-cases/consejos-logic.ts';

const ROJOS_PRIMERO = [
  { severidad: 'rojo', titulo: 'Deuda', texto: 'Reduce la cuota.' },
  { severidad: 'amarillo', titulo: 'Ahorro', texto: 'Sube el colchón.' },
  { severidad: 'verde', titulo: 'Fondo', texto: 'Mantén el rumbo.' },
];

function puertoConsejos(consejos) {
  return { consejosVigentes: async () => consejos };
}

describe('consejos vigentes (REQ-16-05)', () => {
  it('carga los consejos desde el puerto inyectado', async () => {
    const consejos = await cargarConsejos(puertoConsejos(ROJOS_PRIMERO));
    assert.equal(consejos.length, 3);
    assert.equal(consejos[0].titulo, 'Deuda');
  });

  it('sin datos todavía devuelve lista vacía inicial', () => {
    assert.deepEqual(CONSEJOS_INICIALES, []);
  });

  it('muestra como máximo cinco consejos conservando el orden', () => {
    const doce = Array.from({ length: 12 }, (_, i) => ({
      severidad: 'verde',
      titulo: `Consejo ${i}`,
      texto: 'Texto.',
    }));
    const visiblesLista = visibles(doce);
    assert.equal(visiblesLista.length, 5);
    assert.equal(visiblesLista[0].titulo, 'Consejo 0');
    // Con menos de cinco no recorta.
    assert.equal(visibles(ROJOS_PRIMERO).length, 3);
  });

  it('mapea la severidad del semáforo a su token visual', () => {
    assert.equal(claseSeveridad('rojo'), 'negativo');
    assert.equal(claseSeveridad('amarillo'), 'aviso');
    assert.equal(claseSeveridad('verde'), 'positivo');
  });
});
