// Tests para crearGuardadoConDebounce (lógica base)
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { crearGuardadoConDebounce } from '../../src/domain/use-cases/onboarding/onboarding-debounce.ts';

describe('F25 — crearGuardadoConDebounce (lógica base)', () => {
  it('ejecuta la función de guardado después del debounce (500ms)', async () => {
    let guardado = 0;
    const { ejecutar, cancelar } = crearGuardadoConDebounce(500, async () => { guardado++; });
    
    ejecutar();
    assert.equal(guardado, 0);
    
    await new Promise(r => setTimeout(r, 550));
    assert.equal(guardado, 1);
    
    cancelar();
  });

  it('solo ejecuta la última llamada si se llaman múltiples veces antes del debounce', async () => {
    let guardado = 0;
    const { ejecutar, cancelar } = crearGuardadoConDebounce(500, async () => { guardado++; });
    
    ejecutar();
    ejecutar();
    ejecutar();
    
    await new Promise(r => setTimeout(r, 550));
    assert.equal(guardado, 1);
    
    cancelar();
  });

  it('flush ejecuta la función pendiente sin esperar', async () => {
    let guardado = 0;
    const { ejecutar, flush, cancelar } = crearGuardadoConDebounce(500, async () => { guardado++; });
    
    ejecutar();
    assert.equal(guardado, 0);
    
    await flush();
    assert.equal(guardado, 1);
    
    cancelar();
  });

  it('cancelar cancela la ejecución pendiente', async () => {
    let guardado = 0;
    const { ejecutar, cancelar } = crearGuardadoConDebounce(500, async () => { guardado++; });
    
    ejecutar();
    cancelar();
    
    await new Promise(r => setTimeout(r, 550));
    assert.equal(guardado, 0);
  });

  it('devuelve funciones que pueden usarse independientemente', () => {
    let llamadas = 0;
    const fn = async () => { llamadas++; };
    
    const guardado1 = crearGuardadoConDebounce(100, fn);
    const guardado2 = crearGuardadoConDebounce(100, fn);
    
    guardado1.ejecutar();
    guardado2.ejecutar();
    
    assert.ok(typeof guardado1.cancelar === 'function');
    assert.ok(typeof guardado2.flush === 'function');
    
    guardado1.cancelar();
    guardado2.cancelar();
  });
});