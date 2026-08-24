// REQ-06-05: fila de totales del registro mensual: subtotal de
// ingresos, subtotal de gastos y utilidad del mes (ingresos − gastos).
import type { MonthlyRecord } from '../entities/monthly-record.ts';
import { totalGastos, totalIngresos } from '../entities/monthly-record.ts';

/** Totales recalculables en vivo mientras el usuario edita importes. */
export interface TotalesRegistro {
  readonly ingresos: number;
  readonly gastos: number;
  /** Utilidad del mes: ingresos menos gastos (puede ser negativa). */
  readonly utilidad: number;
}

/**
 * Subtotales por tarjeta y utilidad del mes a partir de un registro;
 * las claves ausentes cuentan como cero, igual que en el backend.
 */
export function totalesDeRegistro(registro: MonthlyRecord): TotalesRegistro {
  const ingresos = totalIngresos(registro);
  const gastos = totalGastos(registro);
  return { ingresos, gastos, utilidad: ingresos - gastos };
}
