// Tests del módulo puro de ocupación del wizard (feature 33, REQ-33-01..06)
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { crearOcupacionOnboarding } from '../../src/domain/use-cases/onboarding/onboarding-ocupacion.ts';
import { DEBOUNCE_MS } from '../../src/domain/use-cases/onboarding/onboarding-estado.ts';
import { crearLogicaGuardado } from '../../src/domain/use-cases/onboarding/onboarding-guardado.ts';

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

describe('F33 — onboarding-ocupacion: editar no ocupa (REQ-33-01)', () => {
  it('editar marca ocupación false y no dispara el guardado inmediato', async () => {
    let llamadas = [];
    const g = crearOcupacionOnboarding(40, async (d) => { llamadas.push(d); });
    const e1 = g.editar('A');
    assert.equal(e1.ocupado, false);
    const e2 = g.editar('AA');
    assert.equal(e2.ocupado, false);
    assert.equal(g.estado().ocupado, false);
    assert.deepEqual(llamadas, [], 'ningún IPC durante la ventana de debounce');
    await esperar(90);
    await esperar(10);
    assert.equal(g.estado().ocupado, false);
  });
});

describe('F33 — onboarding-ocupacion: en vuelo (REQ-33-02)', () => {
  it('expirar el debounce activa exactamente un guardado con ocupación true solo en vuelo', async () => {
    let llamadas = [];
    let resolver = null;
    const g = crearOcupacionOnboarding(40, (d) => new Promise((res) => { llamadas.push(d); resolver = res; }));
    let ultimo = null;
    g.alCambiar((e) => { ultimo = e; });
    g.editar('A');
    g.editar('AB');
    g.editar('ABC');
    assert.equal(llamadas.length, 0, 'durante el debounce no hay IPC');
    await esperar(90);
    assert.equal(llamadas.length, 1, 'exactamente un guardado por ráfaga');
    assert.equal(ultimo.ocupado, true, 'ocupación true mientras el envío está en vuelo');
    resolver();
    await esperar(20);
    assert.equal(ultimo.ocupado, false, 'terminar el guardado restablece ocupación false');
    assert.equal(g.estado().ocupado, false);
    assert.deepEqual(llamadas, ['ABC'], 'se envían los últimos datos acumulados');
  });

  it('agrupa una ráfaga de N ediciones en un único guardarFn y DEBOUNCE_MS permanece 500 (REQ-33-06)', async () => {
    assert.equal(DEBOUNCE_MS, 500);
    assert.ok(crearLogicaGuardado, 'crearLogicaGuardado se conserva en el dominio');
    let llamadas = [];
    const g = crearOcupacionOnboarding(DEBOUNCE_MS, async (d) => { llamadas.push(d); });
    for (let i = 0; i < 7; i++) g.editar(`dato-${i}`);
    await esperar(560);
    await esperar(20);
    assert.equal(llamadas.length, 1, `una sola llamada IPC, hubo ${llamadas.length}`);
    assert.equal(llamadas[0], 'dato-6', 'con los últimos datos acumulados');
    assert.equal(g.estado().ocupado, false);
  });
});

describe('F33 — onboarding-ocupacion: flush siempre restablece (REQ-33-04)', () => {
  it('flush sin guardado pendiente restablece ocupación false (regresión CR-2)', async () => {
    let llamadas = [];
    const g = crearOcupacionOnboarding(40, async (d) => { llamadas.push(d); });
    // Escenario CR-2: editar, esperar a que el guardado termine solo y navegar.
    g.editar('A');
    await esperar(90);
    await esperar(20);
    assert.equal(g.estado().ocupado, false);
    const e = await g.flush();
    assert.equal(e.ocupado, false, 'flush sin pendiente NO deja la ocupación a true');
    assert.equal(g.estado().ocupado, false);
    // Instancia recién creada: flush inmediato tampoco ocupa.
    const g2 = crearOcupacionOnboarding(40, async () => {});
    const e2 = await g2.flush();
    assert.equal(e2.ocupado, false);
  });

  it('flush con guardado pendiente lo ejecuta y termina con ocupación false', async () => {
    let llamadas = [];
    let liberar = null;
    const g = crearOcupacionOnboarding(5000, (d) => new Promise((res) => { llamadas.push(d); liberar = res; }));
    g.editar('pendiente');
    const promesa = g.flush();
    await esperar(10);
    assert.equal(g.estado().ocupado, true, 'en vuelo mientras flush ejecuta el pendiente');
    liberar();
    const e = await promesa;
    assert.deepEqual(llamadas, ['pendiente']);
    assert.equal(e.ocupado, false);
  });
});

describe('F33 — onboarding-ocupacion: error registrado sin bloquear edición (REQ-33-05)', () => {
  it('flush con error restablece ocupación false, registra el fallo y conserva los datos locales', async () => {
    const fallo = new Error('IPC caido');
    let intentos = 0;
    let llamadas = [];
    const g = crearOcupacionOnboarding(40, async (d) => {
      llamadas.push(d);
      intentos += 1;
      if (intentos === 1) throw fallo; // solo el primer envío falla
    });
    let ultimo = null;
    g.alCambiar((e) => { ultimo = e; });
    g.editar('datos-locales');
    await esperar(90);
    await esperar(20);
    assert.equal(g.estado().ocupado, false, 'el error restablece la ocupación');
    assert.match(String(g.estado().error), /IPC caido/, 'el fallo queda registrado');
    // Los datos locales editados se conservan: una nueva edición sigue enviando datos.
    g.editar('datos-locales-2');
    await esperar(90);
    await esperar(20);
    assert.deepEqual(llamadas, ['datos-locales', 'datos-locales-2']);
    assert.equal(ultimo.error, null, 'un guardado posterior exitoso limpia el error');
  });
});
