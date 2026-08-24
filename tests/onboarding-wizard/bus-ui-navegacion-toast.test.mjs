// REQ-27-07/08: bus de eventos UI — navegar a Registro y toast de
// bienvenida tras completar/saltar onboarding. Módulo puro bajo src/lib
// (mismo patrón que estado-tema): sin React ni @tauri-apps/api.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  alNavegar,
  alToast,
  navegarA,
  mostrarToast,
} from '../../src/lib/bus-ui.ts';

describe('bus-ui — navegación (REQ-27-07)', () => {
  it('navegarA publica la sección a los suscriptores', () => {
    const recibidas = [];
    const baja = alNavegar((seccion) => recibidas.push(seccion));
    navegarA('registro');
    baja();
    navegarA('ajustes');
    assert.deepEqual(recibidas, ['registro']);
  });

  it('varios suscriptores reciben el evento; dar de baja uno no rompe', () => {
    const a = [];
    const b = [];
    const bajaA = alNavegar((s) => a.push(s));
    alNavegar((s) => b.push(s));
    navegarA('registro');
    bajaA();
    navegarA('balance');
    assert.deepEqual(a, ['registro']);
    assert.deepEqual(b, ['registro', 'balance']);
  });
});

describe('bus-ui — toasts (REQ-27-07/08)', () => {
  it('mostrarToast publica el mensaje; sin suscriptores no falla', () => {
    assert.doesNotThrow(() => mostrarToast('nadie me escucha'));
    const mensajes = [];
    const baja = alToast((m) => mensajes.push(m));
    mostrarToast('Onboarding completado. ¡Bienvenido, Ana!');
    baja();
    mostrarToast('después de la baja');
    assert.deepEqual(mensajes, ['Onboarding completado. ¡Bienvenido, Ana!']);
  });
});
