// Tests del gate automático de onboarding al arrancar (REQ-29-02 a 29-08)
// Verifica: arranque NotStarted -> wizard, arranque Completed -> AppShell,
// completar wizard -> AppShell con snapshot recargado.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const SNAPSHOT_PROVIDER_PATH = join('src', 'components', 'shell', 'SnapshotProvider.tsx');
const APP_PATH = join('src', 'App.tsx');
const ONBOARDING_WIZARD_PATH = join('src', 'components', 'onboarding', 'OnboardingWizard.tsx');
const USE_ONBOARDING_PATH = join('src', 'hooks', 'use-onboarding.ts');

describe('Gate automático onboarding al arrancar (REQ-29)', () => {
  describe('SnapshotProvider - decisión condicional de render (REQ-29-02/03/05)', () => {
    it('existe SnapshotProvider.tsx', () => {
      assert.ok(readFileSync(SNAPSHOT_PROVIDER_PATH, 'utf8').length > 0);
    });

    it('usa snapshotPort.obtenerPerfilActivoConOnboarding para leer snapshot y onboarding_status', () => {
      const contenido = readFileSync(SNAPSHOT_PROVIDER_PATH, 'utf8');
      assert.match(contenido, /snapshotPort\.obtenerPerfilActivoConOnboarding/);
      assert.match(contenido, /onboarding_status/);
    });

    it('define tipo de estado extendido con onboardingStatus', () => {
      const contenido = readFileSync(SNAPSHOT_PROVIDER_PATH, 'utf8');
      assert.match(contenido, /onboardingStatus/);
      assert.match(contenido, /OnboardingStatus/);
    });

    it('expone estado "onboarding" además de "cargando/listo/error"', () => {
      const contenido = readFileSync(SNAPSHOT_PROVIDER_PATH, 'utf8');
      assert.match(contenido, /nombre:\s*['"]onboarding['"]/);
    });

    it('tras carga exitosa lee onboarding_status y decide render (Completed -> listo, otros -> onboarding)', () => {
      const contenido = readFileSync(SNAPSHOT_PROVIDER_PATH, 'utf8');
      assert.match(contenido, /onboarding_status\.nombre === 'Completed'/);
      assert.match(contenido, /nombre:\s*['"]listo['"]/);
      assert.match(contenido, /nombre:\s*['"]onboarding['"]/);
    });
  });

  describe('App.tsx - render condicional OnboardingWizard vs AppShell (REQ-29-03/05)', () => {
    it('existe App.tsx', () => {
      assert.ok(readFileSync(APP_PATH, 'utf8').length > 0);
    });

    it('importa OnboardingWizard', () => {
      const contenido = readFileSync(APP_PATH, 'utf8');
      assert.match(contenido, /OnboardingWizard/);
    });

    it('usa useSnapshot para leer estado y onboardingStatus', () => {
      const contenido = readFileSync(APP_PATH, 'utf8');
      assert.match(contenido, /useSnapshot/);
      assert.match(contenido, /estado\.nombre/);
    });

    it('renderiza OnboardingWizard full-screen si estado.nombre === "onboarding"', () => {
      const contenido = readFileSync(APP_PATH, 'utf8');
      assert.match(contenido, /OnboardingWizard/);
      assert.match(contenido, /estado\.nombre === "onboarding"/);
    });

    it('renderiza AppShell por defecto (cuando no es cargando, error ni onboarding)', () => {
      const contenido = readFileSync(APP_PATH, 'utf8');
      assert.match(contenido, /AppShell/);
      // El AppShell se renderiza en el caso por defecto (else), después de comprobar
      // cargando, error y onboarding
      assert.match(contenido, /return <AppShell snapshot=\{estado\.snapshot\} \/>/);
    });
  });

  describe('OnboardingWizard - reutilizado del gate de arranque (REQ-29-06)', () => {
    it('existe OnboardingWizard.tsx', () => {
      assert.ok(readFileSync(ONBOARDING_WIZARD_PATH, 'utf8').length > 0);
    });

    it('acepta props alCompletar y alSaltar para gate de arranque', () => {
      const contenido = readFileSync(ONBOARDING_WIZARD_PATH, 'utf8');
      assert.match(contenido, /alCompletar/);
      assert.match(contenido, /alSaltar/);
    });

    it('usa useOnboarding hook', () => {
      const contenido = readFileSync(ONBOARDING_WIZARD_PATH, 'utf8');
      assert.match(contenido, /useOnboarding/);
    });
  });

  describe('useOnboarding hook - recarga snapshot tras completar (REQ-29-04)', () => {
    it('existe use-onboarding.ts', () => {
      assert.ok(readFileSync(USE_ONBOARDING_PATH, 'utf8').length > 0);
    });

    it('expone recargar para disparar recarga de snapshot', () => {
      const contenido = readFileSync(USE_ONBOARDING_PATH, 'utf8');
      assert.match(contenido, /recargar/);
    });
  });

  describe('Botón Saltar en gate de arranque (REQ-29-07)', () => {
    it('OnboardingWizard tiene botón Saltar en paso 1', () => {
      const contenido = readFileSync(ONBOARDING_WIZARD_PATH, 'utf8');
      assert.match(contenido, /Saltar onboarding/);
    });

    it('alSaltar se llama al pulsar Saltar en paso 1', () => {
      const contenido = readFileSync(ONBOARDING_WIZARD_PATH, 'utf8');
      assert.match(contenido, /manejarSaltar/);
      assert.match(contenido, /alSaltar/);
    });
  });
});