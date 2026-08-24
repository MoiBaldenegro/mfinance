// REQ-16-08: histórico de cierres consultable desde los assessments
// persistidos en el snapshot: fila resumen por mes cerrado.
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import type { AssessmentRegistro, Presupuesto } from '../entities/cierre.ts';

/** Fila del histórico lista para la tabla de cierres anteriores. */
export interface FilaHistorico {
  /** Mes que quedó cerrado (YYYY-MM). */
  readonly mes: string;
  /** Fecha del cierre en ISO YYYY-MM-DD. */
  readonly fecha: string;
  /** Total presupuestado para el mes siguiente a ese cierre. */
  readonly totalPresupuesto: number;
}

function totalPresupuestado(presupuesto: Presupuesto): number {
  return Object.values(presupuesto).reduce<number>(
    (total, valor) => total + (valor ?? 0),
    0,
  );
}

function fila(assessment: AssessmentRegistro): FilaHistorico {
  return {
    mes: assessment.mes,
    fecha: assessment.fecha_cierre,
    totalPresupuesto: totalPresupuestado(assessment.presupuesto_siguiente),
  };
}

/**
 * Resúmenes de los meses cerrados, del más reciente al más antiguo,
 * calculados en puro sobre el snapshot cargado.
 */
export function resumenesHistorico(
  snapshot: FinanceSnapshot,
): readonly FilaHistorico[] {
  const assessments = snapshot.assessments ?? [];
  return [...assessments]
    .sort((a, b) => b.mes.localeCompare(a.mes))
    .map(fila);
}
