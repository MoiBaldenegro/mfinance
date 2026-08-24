// Tests del hook useOnboarding
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const HOOK_PATH = join('src', 'hooks', 'use-onboarding.ts');

describe('useOnboarding hook — lógica (REQ-24-03, 24-05)', () => {
  it('existe el archivo use-onboarding.ts', () => {
    assert.ok(readFileSync(HOOK_PATH, 'utf8').length > 0);
  });

  it('importa caso de uso gestionarOnboarding', () => {
    const contenido = readFileSync(HOOK_PATH, 'utf8');
    assert.match(contenido, /gestionarOnboarding/);
  });

  it('importa DEBOUNCE_MS del dominio', () => {
    const contenido = readFileSync(HOOK_PATH, 'utf8');
    assert.match(contenido, /DEBOUNCE_MS/);
    assert.match(contenido, /onboarding\/index/);
  });

  it('delega la ocupación del guardado al módulo puro onboarding-ocupacion (F33)', () => {
    const contenido = readFileSync(HOOK_PATH, 'utf8');
    assert.match(contenido, /crearOcupacionOnboarding/);
    assert.match(contenido, /onboarding-ocupacion/);
  });

  it('hace flush inmediato al cambiar de paso via ocupacion.flush (F33)', () => {
    const contenido = readFileSync(HOOK_PATH, 'utf8');
    assert.match(contenido, /siguientePaso/);
    assert.match(contenido, /ocupacion\.flush\(\)/);
  });

  it('expone actualizarPaso1, actualizarPaso2, completar, saltar, recargar', () => {
    const contenido = readFileSync(HOOK_PATH, 'utf8');
    assert.match(contenido, /actualizarPaso1/);
    assert.match(contenido, /completar/);
    assert.match(contenido, /saltar/);
    assert.match(contenido, /recargar/);
  });
});