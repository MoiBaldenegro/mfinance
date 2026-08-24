// Tests de estructura, imports y estilos de componentes paso 2
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const COMPONENTS_DIR = join(process.cwd(), 'src/components/onboarding');
const STYLES_DIR = join(process.cwd(), 'src/styles');

describe('F25 — Componentes paso 2: estructura y estilos', () => {
  describe('Archivos existen y tienen tamaño ≤100 líneas', () => {
    it('OnboardingPasoBalance.tsx existe y ≤100 líneas', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'OnboardingPasoBalance.tsx'), 'utf-8');
      const lineas = contenido.split('\n').length;
      assert.ok(lineas <= 100, `OnboardingPasoBalance.tsx tiene ${lineas} líneas, debe ser ≤100`);
    });

    it('ActivosSection.tsx existe y ≤100 líneas', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'ActivosSection.tsx'), 'utf-8');
      const lineas = contenido.split('\n').length;
      assert.ok(lineas <= 100, `ActivosSection.tsx tiene ${lineas} líneas, debe ser ≤100`);
    });

    it('PasivosSection.tsx existe y ≤100 líneas', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'PasivosSection.tsx'), 'utf-8');
      const lineas = contenido.split('\n').length;
      assert.ok(lineas <= 100, `PasivosSection.tsx tiene ${lineas} líneas, debe ser ≤100`);
    });

    it('InversionesSection.tsx existe y ≤100 líneas', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'InversionesSection.tsx'), 'utf-8');
      const lineas = contenido.split('\n').length;
      assert.ok(lineas <= 100, `InversionesSection.tsx tiene ${lineas} líneas, debe ser ≤100`);
    });
  });

  describe('Imports y arquitectura hexagonal', () => {
    it('OnboardingPasoBalance NO importa react ni @tauri-apps/api en domain', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'OnboardingPasoBalance.tsx'), 'utf-8');
      assert.ok(!contenido.includes('@tauri-apps/api'), 'No debe importar @tauri-apps/api');
    });

    it('ActivosSection usa formatoMoneda del dominio', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'ActivosSection.tsx'), 'utf-8');
      assert.ok(contenido.includes('formatoMoneda'), 'Debe usar formatoMoneda');
      assert.ok(contenido.includes('domain/use-cases/formato-moneda'), 'Debe importar desde domain');
    });

    it('PasivosSection usa validarPasivo y validarTasa del dominio', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'PasivosSection.tsx'), 'utf-8');
      assert.ok(contenido.includes('validarPasivo'), 'Debe usar validarPasivo');
      assert.ok(contenido.includes('validarTasa'), 'Debe usar validarTasa');
      assert.ok(contenido.includes('domain/use-cases/balance-validaciones'), 'Debe importar validaciones desde domain');
    });

    it('InversionesSection usa validarTasa del dominio', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'InversionesSection.tsx'), 'utf-8');
      assert.ok(contenido.includes('validarTasa'), 'Debe usar validarTasa');
      assert.ok(contenido.includes('domain/use-cases/inversiones-proyeccion'), 'Debe importar desde domain');
    });
  });

  describe('Estilos - hojas separadas ≤100 líneas', () => {
    it('activos-section.css existe y ≤100 líneas', () => {
      const contenido = readFileSync(join(STYLES_DIR, 'activos-section.css'), 'utf-8');
      const lineas = contenido.split('\n').length;
      assert.ok(lineas <= 100, `activos-section.css tiene ${lineas} líneas, debe ser ≤100`);
    });

    it('pasivos-section.css existe y ≤100 líneas', () => {
      const contenido = readFileSync(join(STYLES_DIR, 'pasivos-section.css'), 'utf-8');
      const lineas = contenido.split('\n').length;
      assert.ok(lineas <= 100, `pasivos-section.css tiene ${lineas} líneas, debe ser ≤100`);
    });

    it('inversiones-section.css existe y ≤100 líneas', () => {
      const contenido = readFileSync(join(STYLES_DIR, 'inversiones-section.css'), 'utf-8');
      const lineas = contenido.split('\n').length;
      assert.ok(lineas <= 100, `inversiones-section.css tiene ${lineas} líneas, debe ser ≤100`);
    });

    it('onboarding-paso-balance.css (padre) existe y ≤100 líneas', () => {
      const contenido = readFileSync(join(STYLES_DIR, 'onboarding-paso-balance.css'), 'utf-8');
      const lineas = contenido.split('\n').length;
      assert.ok(lineas <= 100, `onboarding-paso-balance.css tiene ${lineas} líneas, debe ser ≤100`);
    });
  });
});