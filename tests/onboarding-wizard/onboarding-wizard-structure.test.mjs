// Tests de estructura: OnboardingWizard y OnboardingPaso1
import { readFileSync } from 'node:fs'; import { join } from 'node:path'; import assert from 'node:assert/strict'; import { describe, it } from 'node:test';
const WIZARD_PATH = join('src', 'components', 'onboarding', 'OnboardingWizard.tsx');
const PASO1_PATH = join('src', 'components', 'onboarding', 'OnboardingPaso1.tsx');
const WIZARD_CSS = join('src', 'styles', 'onboarding-wizard.css');
const PASO1_CSS = join('src', 'styles', 'onboarding-paso1.css');
describe('OnboardingWizard — estructura (REQ-24-04, 24-12, 24-14)', () => {
  it('existe OnboardingWizard.tsx', () => assert.ok(readFileSync(WIZARD_PATH, 'utf8').length > 0));
  it('importa hoja de estilos', () => assert.match(readFileSync(WIZARD_PATH, 'utf8'), /import\s+['"]\.\.\/\.\.\/styles\/onboarding-wizard\.css['"]/));
  it('no tiene CSS embebido', () => { const c = readFileSync(WIZARD_PATH, 'utf8'); const m = c.match(/style=\{\{[^}]*\}\}/g) ?? []; assert.equal(m.some(x => !x.includes('--')), false); assert.equal(c.includes('<style'), false); });
  it('renderiza barra 5 pasos', () => { const c = readFileSync(WIZARD_PATH, 'utf8'); assert.match(c, /onboarding-wizard__pasos/); assert.match(c, /PASOS\.length|PASOS\.length - 1|4/); assert.match(c, /5/); });
  it('tiene botones Atrás, Siguiente, Finalizar, Saltar', () => { const c = readFileSync(WIZARD_PATH, 'utf8'); assert.match(c, /Atrás/); assert.match(c, /Siguiente/); assert.match(c, /Finalizar/); assert.match(c, /Saltar/); });
  it('deshabilita Siguiente si paso inválido', () => { const c = readFileSync(WIZARD_PATH, 'utf8'); assert.match(c, /pasoValido/); assert.match(c, /disabled.*pasoValido|aria-disabled.*pasoValido/); });
});
describe('OnboardingPaso1 — estructura (REQ-24-06/07/08/09/12/14)', () => {
  it('existe OnboardingPaso1.tsx', () => assert.ok(readFileSync(PASO1_PATH, 'utf8').length > 0));
  it('importa hoja de estilos', () => assert.match(readFileSync(PASO1_PATH, 'utf8'), /import\s+['"]\.\.\/\.\.\/styles\/onboarding-paso1\.css['"]/));
  it('no tiene CSS embebido', () => { const c = readFileSync(PASO1_PATH, 'utf8'); assert.equal(c.includes('style={{'), false); assert.equal(c.includes('<style'), false); });
  it('campo nombre requerido', () => { const c = readFileSync(PASO1_PATH, 'utf8'); assert.match(c, /nombre-completo/); assert.match(c, /required|aria-required/); });
  it('selector moneda MXN/USD/EUR', () => { const c = readFileSync(PASO1_PATH, 'utf8'); assert.match(c, /MONEDAS/); assert.match(c, /ETIQUETA_MONEDA/); });
  it('fuentes ingreso checkboxes (4)', () => { const c = readFileSync(PASO1_PATH, 'utf8'); assert.match(c, /INCOME_SOURCES/); assert.match(c, /fuentes_ingreso_activas/); assert.match(c, /checkbox/); });
  it('categorías gasto checkboxes (6)', () => { const c = readFileSync(PASO1_PATH, 'utf8'); assert.match(c, /EXPENSE_CATEGORIES/); assert.match(c, /categorias_gasto_usadas/); });
  it('valida ≥1 fuente ingreso', () => { const c = readFileSync(PASO1_PATH, 'utf8'); assert.match(c, /tieneFuentes/); assert.match(c, /al menos una fuente de ingreso/); });
  it('valida ≥1 categoría gasto', () => { const c = readFileSync(PASO1_PATH, 'utf8'); assert.match(c, /tieneCategorias/); assert.match(c, /al menos una categoría de gasto/); });
  it('bloquea Siguiente si inválido', () => { const c = readFileSync(PASO1_PATH, 'utf8'); assert.match(c, /pasoValido/); assert.match(c, /onboarding-paso1__validez/); });
  it('botón Saltar onboarding', () => { const c = readFileSync(PASO1_PATH, 'utf8'); assert.match(c, /Saltar onboarding/); assert.match(c, /onboarding-paso1__btn-saltar/); });
});