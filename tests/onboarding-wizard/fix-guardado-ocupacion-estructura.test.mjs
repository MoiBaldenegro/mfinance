// Test estructural feature 33 (estilo estructura-integracion-27):
// semántica de ocupación en use-onboarding.ts y cableado del wizard.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const HOOK = readFileSync(join('src', 'hooks', 'use-onboarding.ts'), 'utf8');
const WIZARD = readFileSync(join('src', 'components', 'onboarding', 'OnboardingWizard.tsx'), 'utf8');

function cuerpo(nombre, fuente) {
  const ini = fuente.indexOf(`const ${nombre} =`);
  assert.ok(ini >= 0, `no se encuentra ${nombre} en el hook`);
  const fin = fuente.indexOf('\n  const ', ini + 1);
  return fuente.slice(ini, fin === -1 ? undefined : fin);
}

describe('F33 — use-onboarding: editar jamás activa ocupación (REQ-33-01/03)', () => {
  const aplicar = cuerpo('aplicar', HOOK);
  it('aplicar NO invoca setGuardando(true)', () => {
    assert.doesNotMatch(aplicar, /setGuardando\(true\)/);
    assert.match(aplicar, /\.editar\(/, 'aplicar delega la ocupación al módulo puro');
  });
  it('act1-act4 no contienen setGuardando(true)', () => {
    for (const nombre of ['act1', 'act2', 'act3', 'act4']) {
      assert.doesNotMatch(cuerpo(nombre, HOOK), /setGuardando\(true\)/);
    }
  });
  it('el hook completo no contiene setGuardando(true) (la ocupación vive en el módulo puro)', () => {
    assert.doesNotMatch(HOOK, /setGuardando\(true\)/);
  });
});

describe('F33 — sig/comp/salt restablecen la ocupación en finally (REQ-33-04)', () => {
  for (const nombre of ['sig', 'comp', 'salt']) {
    it(`${nombre}() usa try/finally con restablecer de la máquina de ocupación`, () => {
      const c = cuerpo(nombre, HOOK);
      assert.match(c, /finally/, `${nombre} debe tener bloque finally`);
      assert.match(c, /restablecer\(\)/, `${nombre} debe restablecer la ocupación en finally`);
      if (nombre !== 'sig') assert.match(c, /await .*flush/, `${nombre} hace flush del guardado pendiente`);
    });
  }
});

describe('F33 — deshabilitado del contenido NO deriva de persistencia parcial (REQ-33-03)', () => {
  it('OnboardingWizard NO pasa guardando como deshabilitado a WizardContenido', () => {
    assert.doesNotMatch(WIZARD, /deshabilitado=\{guardando\}/);
  });
  it('WizardContenido recibe deshabilitado={operacionEnCurso} (solo operaciones bloqueantes)', () => {
    assert.match(WIZARD, /deshabilitado=\{operacionEnCurso\}/);
  });
  it('los botones Atrás/Saltar/Siguiente dependen de operacionEnCurso y ya no de guardando', () => {
    assert.doesNotMatch(WIZARD, /disabled=[^>]*guardando/);
    assert.match(WIZARD, /disabled=\{currentStep === 1 \|\| operacionEnCurso\}/);
    assert.match(WIZARD, /disabled=\{!pasoValido \|\| operacionEnCurso\}/);
  });
  it('el toast Guardando cambios sigue ligado a guardando (solo IPC en vuelo)', () => {
    assert.match(WIZARD, /\{guardando && <div className="onboarding-wizard__guardando"/);
  });
});

describe('F33 — arquitectura conservada', () => {
  it('el hook delega en el módulo puro onboarding-ocupacion', () => {
    assert.match(HOOK, /crearOcupacionOnboarding/);
    assert.match(HOOK, /onboarding-ocupacion/);
  });
  it('se conservan crearLogicaGuardado y DEBOUNCE_MS=500', () => {
    assert.equal(readFileSync(join('src', 'domain', 'use-cases', 'onboarding', 'onboarding-guardado.ts'), 'utf8').includes('crearLogicaGuardado'), true);
    const estado = readFileSync(join('src', 'domain', 'use-cases', 'onboarding', 'onboarding-estado.ts'), 'utf8');
    assert.match(estado, /DEBOUNCE_MS = 500/);
  });
});
