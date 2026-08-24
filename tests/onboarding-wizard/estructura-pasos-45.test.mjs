// REQ-27-01/02/03/05/12: estructura de los componentes de los pasos 4-5
// del wizard (secciones, límites visibles, hojas y sin CSS embebido).
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const leer = (ruta) => readFileSync(join('src', ruta), 'utf8');

describe('Paso 4 — OnboardingPasoMetas y secciones (REQ-27-01/02/03)', () => {
  const PADRE = 'components/onboarding/OnboardingPasoMetas.tsx';
  const UMBRALES = 'components/onboarding/IndicadoresUmbralesSection.tsx';
  const JOURNAL = 'components/onboarding/MetasJournalSection.tsx';

  it('existe el padre e importa sus dos secciones y su hoja', () => {
    const c = leer(PADRE);
    assert.match(c, /IndicadoresUmbralesSection/);
    assert.match(c, /MetasJournalSection/);
    assert.match(c, /styles\/onboarding-paso-metas\.css/);
    assert.ok(existsSync(join('src', 'styles', 'onboarding-paso-metas.css')));
  });

  it('umbrales: 4 indicadores, campos verde/rojo y restaurar defectos', () => {
    const c = leer(UMBRALES);
    for (const texto of ['Endeudamiento', 'Tasa de ahorro', 'Fondo de emergencia', 'Ingreso pasivo']) {
      assert.ok(c.includes(texto), `falta ${texto}`);
    }
    assert.match(c, /Restaurar valores por defecto/);
    // La validación cruzada vive en el caso de uso, no en la UI.
    assert.match(c, /validarUmbrales/);
    assert.match(c, /styles\/indicadores-umbrales\.css/);
  });

  it('journal: CRUD con límites y contador, mensajes en español', () => {
    const c = leer(JOURNAL);
    const f = leer('components/onboarding/FormularioMeta.tsx');
    assert.match(f, /Añadir meta/);
    assert.match(f, /maxLength=\{100\}|maxLength=\{'100'\}|maxLength=\{LIMITES_META/);
    assert.ok(f.includes('5000'), 'contador/límite de descripción');
    assert.match(f, /validarMeta|LIMITES_META/);
    assert.match(c, /Editar|editar/);
    assert.match(c, /Eliminar|eliminar/);
    assert.match(c, /styles\/metas-journal\.css/);
  });

  it('ningún componente nuevo incrusta CSS', () => {
    for (const ruta of [PADRE, UMBRALES, JOURNAL]) {
      const c = leer(ruta);
      assert.equal(c.includes('<style'), false, ruta);
      const suelto = c.match(/style=\{\{[^}]*\}\}/g) ?? [];
      assert.equal(suelto.some((m) => !m.includes('--')), false, ruta);
    }
  });
});

describe('Paso 5 — OnboardingPasoResumen (REQ-27-05)', () => {
  it('usa el caso de uso del resumen y renderiza las secciones con checks', () => {
    const c = leer('components/onboarding/OnboardingPasoResumen.tsx');
    assert.match(c, /construirResumenOnboarding/);
    assert.match(c, /resumen-seccion--completo|✓|check/);
    assert.match(c, /styles\/onboarding-paso-resumen\.css/);
  });
});
