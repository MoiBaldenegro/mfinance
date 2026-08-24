// REQ-16-07: estado de cierre de un mes: un mes con assessment persistido
// está cerrado y su registro mensual se trata como solo lectura hasta
// que el usuario lo reabra explícitamente.
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import type { AssessmentRegistro } from '../entities/cierre.ts';

/** ¿El mes (YYYY-MM) está cerrado en el snapshot cargado? */
export function mesEstaCerrado(snapshot: FinanceSnapshot, mes: string): boolean {
  const assessments = snapshot.assessments ?? [];
  return assessments.some((assessment) => assessment.mes === mes);
}

/** Assessment persistido del mes cerrado, si existe (REQ-16-08). */
export function assessmentDeMes(
  snapshot: FinanceSnapshot,
  mes: string,
): AssessmentRegistro | undefined {
  const assessments = snapshot.assessments ?? [];
  return assessments.find((assessment) => assessment.mes === mes);
}

/** Aviso en español para la UI cuando el mes seleccionado está cerrado. */
export function avisoMesCerrado(mes: string): string {
  return (
    `El mes ${mes} está cerrado y su registro es solo lectura. ` +
    'Pulsa «Reabrir mes» si necesitas editarlo.'
  );
}
