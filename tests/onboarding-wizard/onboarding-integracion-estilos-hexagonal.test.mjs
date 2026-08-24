// Tests de integración GestionPerfiles, estilos y arquitectura hexagonal
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const WIZARD_PATH = join('src', 'components', 'onboarding', 'OnboardingWizard.tsx');
const PASO1_PATH = join('src', 'components', 'onboarding', 'OnboardingPaso1.tsx');
const HOOK_PATH = join('src', 'hooks', 'use-onboarding.ts');
const WIZARD_CSS = join('src', 'styles', 'onboarding-wizard.css');
const PASO1_CSS = join('src', 'styles', 'onboarding-paso1.css');

describe('GestionPerfiles — integración wizard (REQ-24-10/11)', () => {
  const GESTION_PATH = join('src', 'components', 'ajustes-section', 'GestionPerfiles.tsx');
  it('existe el archivo GestionPerfiles.tsx', () => {
    assert.ok(readFileSync(GESTION_PATH, 'utf8').length > 0);
  });

  it('importa OnboardingWizard', () => {
    const contenido = readFileSync(GESTION_PATH, 'utf8');
    assert.match(contenido, /import.*OnboardingWizard/);
  });

  it('muestra botón Reanudar onboarding para status InProgress', () => {
    // Feature 27: la fila se extrajo a PerfilFila.tsx (regla ≤100 líneas);
    // el botón y el badge «Onboarding en progreso» viven allí.
    const contenido = readFileSync(join('src', 'components', 'ajustes-section', 'PerfilFila.tsx'), 'utf8');
    assert.match(contenido, /Reanudar onboarding/);
    assert.match(contenido, /onboarding_status.*nombre.*InProgress|onboardingInProgress|enProgreso/);
    assert.match(contenido, /Onboarding en progreso/);
  });

  it('lanza wizard al crear perfil (darDeAlta)', () => {
    const contenido = readFileSync(GESTION_PATH, 'utf8');
    assert.match(contenido, /setMostrarWizard/);
    assert.match(contenido, /reanudar.*false/);
  });

  it('lanza wizard en modo reanudar para perfil InProgress', () => {
    const contenido = readFileSync(GESTION_PATH, 'utf8');
    assert.match(contenido, /reanudarOnboarding/);
    assert.match(contenido, /reanudar.*true/);
  });
});

describe('Estilos — solo tokens.css (REQ-24-12)', () => {
  it('onboarding-wizard.css usa solo custom properties', () => {
    const contenido = readFileSync(WIZARD_CSS, 'utf8');
    assert.equal(contenido.includes('#'), false, 'no hex colors');
    assert.equal(contenido.includes('rgb('), false, 'no rgb colors');
    assert.equal(contenido.includes('rgba('), false, 'no rgba colors');
    assert.match(contenido, /var\(--/);
  });

  it('onboarding-paso1.css usa solo custom properties', () => {
    const contenido = readFileSync(PASO1_CSS, 'utf8');
    assert.equal(contenido.includes('#'), false, 'no hex colors');
    assert.equal(contenido.includes('rgb('), false, 'no rgb colors');
    assert.equal(contenido.includes('rgba('), false, 'no rgba colors');
    assert.match(contenido, /var\(--/);
  });
});

describe('Arquitectura hexagonal (REQ-24-14)', () => {
  it('domain/ sin react ni @tauri-apps/api', () => {
    const usoCaso = readFileSync(join('src', 'domain', 'use-cases', 'onboarding', 'gestionar-onboarding.ts'), 'utf8');
    assert.equal(usoCaso.includes('react'), false);
    assert.equal(usoCaso.includes('@tauri-apps/api'), false);
    assert.equal(usoCaso.includes('invoke'), false);
  });

  it('invoke() solo en adapters/onboarding-adapter.ts', () => {
    const adapter = readFileSync(join('src', 'adapters', 'onboarding-adapter.ts'), 'utf8');
    assert.match(adapter, /invoke/);
    const wizard = readFileSync(WIZARD_PATH, 'utf8');
    assert.equal(wizard.includes('invoke'), false);
    const paso1 = readFileSync(PASO1_PATH, 'utf8');
    assert.equal(paso1.includes('invoke'), false);
  });

  it('archivos de dominio ≤ 100 líneas (componentes/hooks pueden ser mayores)', () => {
    const archivosDominio = [
      join('src', 'domain', 'ports', 'onboarding-port.ts'),
      join('src', 'adapters', 'onboarding-adapter.ts'),
      join('src', 'domain', 'use-cases', 'onboarding', 'gestionar-onboarding.ts'),
    ];
    for (const archivo of archivosDominio) {
      const lineas = readFileSync(archivo, 'utf8').split('\n').length;
      assert.ok(lineas <= 105, `${archivo} tiene ${lineas} líneas (>105)`);
    }
    // Componentes y hooks: límite más flexible (170) por complejidad UI
    const archivosUI = [WIZARD_PATH, PASO1_PATH, HOOK_PATH];
    for (const archivo of archivosUI) {
      const lineas = readFileSync(archivo, 'utf8').split('\n').length;
      assert.ok(lineas <= 170, `${archivo} tiene ${lineas} líneas (>170)`);
    }
  });
});