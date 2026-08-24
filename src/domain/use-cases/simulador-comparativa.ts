// REQ-15-04/06: derivación de la vista comparativa (base vs optimizado)
// y las filas formateadas de la tabla de amortización. Puro: sin React
// ni IPC; reutiliza el núcleo multi-moneda (REQ-20-03).
import type {
  ResultadoCredito,
  SimulacionComparada,
} from '../entities/simulador-credito.ts';
import type { Moneda } from '../entities/moneda.ts';
import { formatoMoneda } from './formato-moneda.ts';

/** Métricas de un escenario listas para pintar. */
export interface MetricasEscenarioVista {
  readonly cuota: string;
  readonly meses: number;
  readonly intereses: string;
  readonly totalPagado: string;
}

/** Comparativa completa lista para pintar. */
export interface ComparativaVista {
  readonly base: MetricasEscenarioVista;
  readonly optimizado: MetricasEscenarioVista;
  readonly mesesAhorrados: number;
  readonly interesesAhorrados: string;
  readonly hayAhorro: boolean;
}

function metricasDe(
  resultado: ResultadoCredito,
  moneda: Moneda,
): MetricasEscenarioVista {
  return {
    cuota: formatoMoneda(resultado.cuota_mensual, moneda),
    meses: resultado.meses,
    intereses: formatoMoneda(resultado.intereses_totales, moneda),
    totalPagado: formatoMoneda(resultado.total_pagado, moneda),
  };
}

/** Deriva meses e intereses ahorrados en euros desde la simulación. */
export function comparativaDesdeSimulacion(
  simulacion: SimulacionComparada,
  moneda: Moneda,
): ComparativaVista {
  const hayAhorro =
    simulacion.meses_ahorrados > 0 || simulacion.intereses_ahorrados > 0.005;
  return {
    base: metricasDe(simulacion.base, moneda),
    optimizado: metricasDe(simulacion.optimizado, moneda),
    mesesAhorrados: simulacion.meses_ahorrados,
    interesesAhorrados: formatoMoneda(simulacion.intereses_ahorrados, moneda),
    hayAhorro,
  };
}

/** Fila de la tabla de amortización ya formateada en euros. */
export interface FilaTablaAmortizacion {
  readonly mes: number;
  readonly cuota: string;
  readonly interes: string;
  readonly capital: string;
  readonly saldoRestante: string;
  readonly totalAcumulado: string;
}

/** Convierte la tabla del backend a filas formateadas mes a mes (REQ-15-06). */
export function filasTablaAmortizacion(
  resultado: ResultadoCredito,
  moneda: Moneda,
): FilaTablaAmortizacion[] {
  return resultado.tabla.map((fila) => ({
    mes: fila.mes,
    cuota: formatoMoneda(fila.cuota, moneda),
    interes: formatoMoneda(fila.interes, moneda),
    capital: formatoMoneda(fila.capital, moneda),
    saldoRestante: formatoMoneda(fila.saldo_restante, moneda),
    totalAcumulado: formatoMoneda(fila.total_acumulado, moneda),
  }));
}
