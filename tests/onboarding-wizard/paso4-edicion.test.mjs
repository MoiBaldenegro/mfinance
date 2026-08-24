// REQ-27-02: edición de umbrales, restauración y persistencia en paso 4.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  actualizarPaso4,
  cambiarUmbral,
  restaurarUmbralesDefecto,
  umbralesPorDefecto,
} from '../../src/domain/use-cases/onboarding/onboarding-paso4.ts';

const DATOS_VACIOS = { paso1: null, paso2: null, paso3: null, paso4: null };

describe('paso 4 — edición y restauración (REQ-27-02)', () => {
  it('cambiarUmbral actualiza solo el campo indicado', () => {
    const base = { umbrales: umbralesPorDefecto() };
    const nuevo = cambiarUmbral(base, 'endeudamiento_verde', 12);
    assert.equal(nuevo.umbrales.endeudamiento_verde, 12);
    assert.equal(nuevo.umbrales.endeudamiento_rojo, 30);
    assert.equal(base.umbrales.endeudamiento_verde, 15, 'inmutabilidad');
  });

  it('cambiarUmbral admite vaciar un campo a null', () => {
    const base = { umbrales: umbralesPorDefecto() };
    const nuevo = cambiarUmbral(base, 'ahorro_rojo', null);
    assert.equal(nuevo.umbrales.ahorro_rojo, null);
  });

  it('restaurarUmbralesDefecto vuelve a los valores estándar', () => {
    const tocados = { ...umbralesPorDefecto(), ahorro_verde: 40 };
    assert.notDeepEqual(tocados, umbralesPorDefecto());
    assert.deepEqual(restaurarUmbralesDefecto(), umbralesPorDefecto());
  });

  it('actualizarPaso4 persiste el paso en onboarding_data.paso4', () => {
    // Espejo exacto del backend: Paso4Data solo lleva umbrales; las
    // metas del journal persisten en goals_journal (REQ-27-03).
    const paso4 = { umbrales: umbralesPorDefecto() };
    const datos = actualizarPaso4(DATOS_VACIOS, paso4);
    assert.deepEqual(datos.paso4, paso4);
    assert.equal(datos.paso1, null);
  });
});
