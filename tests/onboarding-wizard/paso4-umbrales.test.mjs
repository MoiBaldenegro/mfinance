// REQ-27-02: paso 4 — umbrales por defecto y validación cruzada.
// Sentido semántico según el layout de design.md (los defaults deben
// ser válidos): endeudamiento exige verde < rojo; ahorro, fondo e
// ingreso pasivo exigen verde > rojo. Nota: requirements.md invierte el
// sentido literal ("verde>rojo endeudamiento/fondo"), lo que invalidaría
// los propios valores por defecto (15<30, 15>5); se documenta como
// errata y manda la coherencia del layout (Verde si ≤ X / Rojo si ≥ Y).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  umbralesPorDefecto,
  validarUmbrales,
} from '../../src/domain/use-cases/onboarding/onboarding-paso4.ts';

describe('paso 4 — umbralesPorDefecto (REQ-27-02)', () => {
  it('coincide con las constantes backend del semáforo (feature 10)', () => {
    const u = umbralesPorDefecto();
    assert.equal(u.endeudamiento_verde, 15);
    assert.equal(u.endeudamiento_rojo, 30);
    assert.equal(u.ahorro_verde, 15);
    assert.equal(u.ahorro_rojo, 5);
    assert.equal(u.fondo_verde, 3);
    assert.equal(u.fondo_rojo, 1);
    assert.equal(u.ingreso_pasivo_verde, 100);
    assert.equal(u.ingreso_pasivo_amarillo, 25);
  });

  it('los defectos pasan la validación cruzada sin avisos', () => {
    assert.deepEqual(validarUmbrales(umbralesPorDefecto()), []);
  });
});

describe('paso 4 — validarUmbrales cruzado (REQ-27-02)', () => {
  it('endeudamiento: verde >= rojo produce aviso en español', () => {
    const u = { ...umbralesPorDefecto(), endeudamiento_verde: 35 };
    const avisos = validarUmbrales(u);
    const aviso = avisos.find((a) => a.campo === 'endeudamiento');
    assert.ok(aviso);
    assert.match(aviso.mensaje, /menor que el rojo/);
  });

  it('fondo de emergencia: verde <= rojo produce aviso', () => {
    const u = { ...umbralesPorDefecto(), fondo_verde: 1, fondo_rojo: 2 };
    const aviso = validarUmbrales(u).find((a) => a.campo === 'fondo_emergencia');
    assert.ok(aviso);
    assert.match(aviso.mensaje, /mayor que el rojo/);
  });

  it('tasa de ahorro: verde <= rojo produce aviso', () => {
    const u = { ...umbralesPorDefecto(), ahorro_verde: 4, ahorro_rojo: 6 };
    const aviso = validarUmbrales(u).find((a) => a.campo === 'ahorro');
    assert.ok(aviso);
    assert.match(aviso.mensaje, /mayor que el rojo/);
  });

  it('ingreso pasivo: verde <= referencia produce aviso', () => {
    const u = { ...umbralesPorDefecto(), ingreso_pasivo_verde: 20, ingreso_pasivo_amarillo: 30 };
    const aviso = validarUmbrales(u).find((a) => a.campo === 'ingreso_pasivo');
    assert.ok(aviso);
    assert.match(aviso.mensaje, /mayor/);
  });

  it('valores vacíos (null) no producen avisos (Option backend)', () => {
    const vacio = {
      endeudamiento_verde: null, endeudamiento_rojo: null,
      ahorro_verde: null, ahorro_rojo: null,
      fondo_verde: null, fondo_rojo: null,
      ingreso_pasivo_verde: null, ingreso_pasivo_amarillo: null,
    };
    assert.deepEqual(validarUmbrales(vacio), []);
    // El tipo sigue siendo espejo del backend con todos los campos.
    assert.equal(Object.keys(umbralesPorDefecto()).length, Object.keys(vacio).length);
  });
});
