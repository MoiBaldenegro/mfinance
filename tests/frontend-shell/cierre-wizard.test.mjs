// Suite feature 16 (1/5): máquina de estados del wizard de cierre
// (REQ-16-01): cuatro pasos, navegación atrás/continuar y barra de progreso.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  PASOS_WIZARD,
  crearWizard,
  avanzar,
  retroceder,
  progresoWizard,
} from '../../src/domain/use-cases/wizard-cierre.ts';

describe('wizard de cierre: pasos y navegación (REQ-16-01)', () => {
  it('declara exactamente repaso presupuesto assessment y confirmación', () => {
    assert.deepEqual([...PASOS_WIZARD], [
      'repaso',
      'presupuesto',
      'assessment',
      'confirmacion',
    ]);
  });

  it('arranca en el primer paso con 25% de progreso', () => {
    const wizard = crearWizard();
    assert.equal(wizard.paso, 0);
    assert.equal(progresoWizard(wizard.paso), 25);
  });

  it('continuar avanza hasta el último paso y ahí se detiene', () => {
    let wizard = crearWizard();
    wizard = avanzar(wizard);
    assert.equal(wizard.paso, 1);
    wizard = avanzar(wizard);
    wizard = avanzar(wizard);
    assert.equal(wizard.paso, 3);
    wizard = avanzar(wizard);
    assert.equal(wizard.paso, 3, 'no debe salir del último paso');
  });

  it('atrás vuelve al paso anterior y no baja del primero', () => {
    let wizard = avanzar(avanzar(crearWizard()));
    wizard = retroceder(wizard);
    assert.equal(wizard.paso, 1);
    wizard = retroceder(wizard);
    wizard = retroceder(wizard);
    assert.equal(wizard.paso, 0, 'no debe bajar del primer paso');
  });

  it('la barra de progreso escala por pasos completados', () => {
    assert.equal(progresoWizard(0), 25);
    assert.equal(progresoWizard(1), 50);
    assert.equal(progresoWizard(2), 75);
    assert.equal(progresoWizard(3), 100);
  });
});
