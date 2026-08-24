// Tests para crearLogicaGuardado (integración con hook)
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { crearLogicaGuardado } from '../../src/domain/use-cases/onboarding/onboarding-guardado.ts';

describe('F25 — crearLogicaGuardado (para hook)', () => {
  it('guarda datos con debounce', async () => {
    let guardado = null;
    const { guardarConDebounce, flushGuardado, cancelarGuardado } = crearLogicaGuardado(500, async (d) => { guardado = d; });
    
    guardarConDebounce({ paso: 1 });
    assert.equal(guardado, null);
    
    await flushGuardado();
    assert.deepEqual(guardado, { paso: 1 });
    
    cancelarGuardado();
  });

  it('solo guarda el último dato si se llaman múltiples veces', async () => {
    let guardado = null;
    const { guardarConDebounce, flushGuardado, cancelarGuardado } = crearLogicaGuardado(500, async (d) => { guardado = d; });
    
    guardarConDebounce({ paso: 1 });
    guardarConDebounce({ paso: 2 });
    guardarConDebounce({ paso: 3 });
    
    await flushGuardado();
    assert.deepEqual(guardado, { paso: 3 });
    
    cancelarGuardado();
  });

  it('cancelarGuardado cancela la ejecución pendiente', async () => {
    let guardado = null;
    const { guardarConDebounce, cancelarGuardado } = crearLogicaGuardado(500, async (d) => { guardado = d; });
    
    guardarConDebounce({ paso: 1 });
    cancelarGuardado();
    
    await new Promise(r => setTimeout(r, 550));
    assert.equal(guardado, null);
  });
});