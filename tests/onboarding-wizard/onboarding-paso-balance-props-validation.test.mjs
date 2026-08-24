// Tests de contratos props, validación delegada y formateo
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const COMPONENTS_DIR = join(process.cwd(), 'src/components/onboarding');

describe('F25 — Componentes paso 2: props, validación y formateo', () => {
  describe('Contratos de props y callbacks', () => {
    it('ActivosSection recibe datos, alCambiar, moneda, deshabilitado', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'ActivosSection.tsx'), 'utf-8');
      assert.ok(contenido.includes('interface Props') || contenido.includes('type Props') || contenido.includes('Props {'), 'Debe definir Props');
      assert.ok(contenido.includes('datos:') && contenido.includes('alCambiar:') && contenido.includes('moneda:') && contenido.includes('deshabilitado:'), 'Props requeridas');
    });

    it('PasivosSection recibe datos, alCambiar, moneda, deshabilitado', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'PasivosSection.tsx'), 'utf-8');
      assert.ok(contenido.includes('datos:') && contenido.includes('alCambiar:') && contenido.includes('moneda:') && contenido.includes('deshabilitado:'), 'Props requeridas');
    });

    it('InversionesSection recibe datos, alCambiar, moneda, deshabilitado', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'InversionesSection.tsx'), 'utf-8');
      assert.ok(contenido.includes('datos:') && contenido.includes('alCambiar:') && contenido.includes('moneda:') && contenido.includes('deshabilitado:'), 'Props requeridas');
    });

    it('OnboardingPasoBalance recibe datos, alCambiar, deshabilitado', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'OnboardingPasoBalance.tsx'), 'utf-8');
      assert.ok(contenido.includes('datos:') && contenido.includes('alCambiar:') && contenido.includes('deshabilitado:'), 'Props requeridas');
    });
  });

  describe('Comportamiento: validación delegada a dominio (REQ-25-05)', () => {
    it('ActivosSection NO tiene validación inline de valor (delega a validarActivo)', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'ActivosSection.tsx'), 'utf-8');
      assert.ok(!contenido.includes('valor <= 0'), 'No debe validar inline, debe usar validarActivo');
    });

    it('PasivosSection NO tiene validación inline de saldo/tasa (delega a validarPasivo + validarTasa)', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'PasivosSection.tsx'), 'utf-8');
      assert.ok(!contenido.includes('saldo <= 0'), 'No debe validar saldo inline');
      assert.ok(!contenido.includes('tasa < 0 || tasa > 30'), 'No debe validar tasa inline');
    });

    it('InversionesSection NO tiene validación inline de aporte/valor/tasa (delega a validarTasa + validaciones dominio)', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'InversionesSection.tsx'), 'utf-8');
      assert.ok(!contenido.includes('aporte < 0'), 'No debe validar aporte inline');
      assert.ok(!contenido.includes('valor < 0'), 'No debe validar valor inline');
      assert.ok(!contenido.includes('tasa < 0 || tasa > 30'), 'No debe validar tasa inline');
    });
  });

  describe('Formateo usa formatoMoneda (REQ-25-08)', () => {
    it('ActivosSection usa formatoMoneda para totales e items', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'ActivosSection.tsx'), 'utf-8');
      const matches = contenido.match(/formatoMoneda/g);
      assert.ok(matches && matches.length >= 2, 'Debe usar formatoMoneda para total e items');
    });

    it('PasivosSection usa formatoMoneda para totales e items', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'PasivosSection.tsx'), 'utf-8');
      const matches = contenido.match(/formatoMoneda/g);
      assert.ok(matches && matches.length >= 2, 'Debe usar formatoMoneda para total e items');
    });

    it('InversionesSection usa formatoMoneda para valor y aporte', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'InversionesSection.tsx'), 'utf-8');
      const matches = contenido.match(/formatoMoneda/g);
      assert.ok(matches && matches.length >= 2, 'Debe usar formatoMoneda para valor y aporte');
    });
  });

  describe('Paso opcional - resumen vacío si sin datos (REQ-25-07)', () => {
    it('OnboardingPasoBalance muestra estado vacío cuando no hay datos', () => {
      const contenido = readFileSync(join(COMPONENTS_DIR, 'OnboardingPasoBalance.tsx'), 'utf-8');
      assert.ok(contenido.includes('vacio-global') || contenido.includes('Sin datos') || contenido.includes('vacío'), 'Debe mostrar estado vacío');
    });
  });
});