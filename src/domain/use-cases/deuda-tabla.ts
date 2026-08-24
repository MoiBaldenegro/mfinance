// REQ-09-03: estructura pura para la tabla de proyección de deuda:
// mes, saldo restante, pago total, intereses, principal.
// Formateo vía el núcleo multi-moneda (REQ-20-03).
import type { ProyeccionDeuda } from '../entities/plan-deuda.ts';
import type { Moneda } from '../entities/moneda.ts';
import { formatoMoneda } from './formato-moneda.ts';

/** Filas formateadas para la tabla de proyección de deuda. */
export interface FilaTablaProyeccion {
  readonly mes: string;
  readonly saldoRestante: string;
  readonly pagoTotal: string;
  readonly intereses: string;
  readonly principal: string;
}

/** Mensaje cuando no hay deudas registradas. */
export const MENSAJE_SIN_DEUDAS =
  '¡Enhorabuena! No tienes deudas registradas. Estás libre de deuda.';

/** Detecta si la proyección está vacía (sin deudas). */
export function proyeccionVacia(proyeccion: ProyeccionDeuda): boolean {
  return proyeccion.filas.length === 0;
}

/** Transforma la proyección en filas formateadas para la tabla. */
export function filasDeTablaProyeccion(
  proyeccion: ProyeccionDeuda,
  moneda: Moneda,
): FilaTablaProyeccion[] {
  return proyeccion.filas.map((fila) => ({
    mes: String(fila.mes),
    saldoRestante: formatoMoneda(fila.saldo_total_restante, moneda),
    pagoTotal: formatoMoneda(fila.pago_total_mes, moneda),
    intereses: formatoMoneda(fila.intereses_mes, moneda),
    principal: formatoMoneda(fila.principal_mes, moneda),
  }));
}

/** Métricas resumen del plan de deuda. */
export interface MetricasPlanDeuda {
  readonly mesesHastaLibre: string;
  readonly interesesTotales: string;
  readonly interesesAhorrados: string;
  readonly totalPagado: string;
}

/** Construye las métricas formateadas del plan. */
export function metricasDePlan(
  proyeccion: ProyeccionDeuda,
  moneda: Moneda,
): MetricasPlanDeuda {
  return {
    mesesHastaLibre: String(proyeccion.meses_hasta_libre),
    interesesTotales: formatoMoneda(proyeccion.intereses_totales, moneda),
    interesesAhorrados: formatoMoneda(proyeccion.intereses_ahorrados, moneda),
    totalPagado: formatoMoneda(proyeccion.total_pagado, moneda),
  };
}