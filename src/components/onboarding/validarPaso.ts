// Ronda 2 fix transversal feature 26: regla de completitud del paso 1 del wizard,
// extraída de OnboardingWizard.tsx para respetar la regla dura de ≤100 líneas.
// El dominio sigue siendo la fuente de verdad de los tipos (Paso1Data).
import type { Paso1Data } from '../../domain/entities/onboarding/index.ts';

/**
 * El paso 1 (datos personales) está completo cuando hay nombre no vacío,
 * al menos una fuente de ingreso activa y al menos una categoría de gasto.
 * Es la única condición que puede bloquear "Siguiente": los pasos 2-5 son
 * opcionales y siempre válidos.
 */
export function esPaso1Completo(paso1: Paso1Data | null | undefined): boolean {
  if (!paso1) return false;
  return (
    paso1.nombre_completo.trim().length > 0 &&
    paso1.fuentes_ingreso_activas.length > 0 &&
    paso1.categorias_gasto_usadas.length > 0
  );
}
