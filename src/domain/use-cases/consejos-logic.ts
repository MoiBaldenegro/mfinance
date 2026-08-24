// REQ-16-05: consejos continuos: carga vía puerto, límite de visibles
// del design.md y mapeo de severidad a clases de token semántico.
import type { Recomendacion, Severidad } from '../entities/cierre.ts';

/** Lista vacía inicial mientras llega la primera carga. */
export const CONSEJOS_INICIALES: readonly Recomendacion[] = [];

/** Puerto mínimo que necesita el caso de uso (testeable con un doble). */
export interface PuertoConsejos {
  consejosVigentes(): Promise<readonly Recomendacion[]>;
}

/**
 * Carga los consejos vigentes del backend; ya vienen priorizados
 * (riesgos rojos primero) por las reglas del assessment.
 */
export async function cargarConsejos(
  port: PuertoConsejos,
): Promise<readonly Recomendacion[]> {
  return port.consejosVigentes();
}

/** Máximo de consejos visibles simultáneamente (design.md). */
const MAXIMO_VISIBLES = 5;

/** Recorta la lista priorizada al máximo visible sin alterar el orden. */
export function visibles(
  consejos: readonly Recomendacion[],
  maximo: number = MAXIMO_VISIBLES,
): readonly Recomendacion[] {
  return consejos.slice(0, maximo);
}

/** Clase CSS BEM-variante derivada de la severidad del semáforo. */
export function claseSeveridad(severidad: Severidad): string {
  switch (severidad) {
    case 'rojo': return 'negativo';
    case 'amarillo': return 'aviso';
    case 'verde': return 'positivo';
  }
}
