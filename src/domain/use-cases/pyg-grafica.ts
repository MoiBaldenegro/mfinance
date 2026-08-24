// REQ-07-03: estructura pura para la gráfica Chart.js: barras de
// ingresos contra gastos por mes con línea superpuesta de ahorro
// acumulado. Los colores llegan inyectados (tokens leídos en el
// componente), para mantener este módulo libre de DOM.
import type { SeriePyg } from '../entities/pyg-serie.ts';

/** Colores de las series, resueltos desde tokens.css en la UI. */
export interface ColoresPyg {
  readonly ingresos: string;
  readonly gastos: string;
  readonly ahorro: string;
}

export type TipoSerieGrafica = 'barra' | 'linea';

/** Una serie dibujable: nombre, tipo (barra|línea), valores y color. */
export interface SerieGrafica {
  readonly nombre: string;
  readonly tipo: TipoSerieGrafica;
  readonly valores: readonly number[];
  readonly color: string;
}

/** Datos completos de la gráfica P&G. */
export interface DatosGraficaPyg {
  readonly etiquetas: readonly string[];
  readonly series: readonly SerieGrafica[];
}

/**
 * Construye etiquetas y las tres series alineadas con la ordenación del
 * backend: barras Ingresos/Gastos y línea de Ahorro acumulado encima.
 */
export function datosDeGrafica(
  serie: SeriePyg,
  colores: ColoresPyg,
): DatosGraficaPyg {
  const filas = serie.filas;
  return {
    etiquetas: filas.map((fila) => fila.mes),
    series: [
      {
        nombre: 'Ingresos',
        tipo: 'barra',
        valores: filas.map((fila) => fila.ingresos),
        color: colores.ingresos,
      },
      {
        nombre: 'Gastos',
        tipo: 'barra',
        valores: filas.map((fila) => fila.gastos),
        color: colores.gastos,
      },
      {
        nombre: 'Ahorro acumulado',
        tipo: 'linea',
        valores: filas.map((fila) => fila.ahorro_acumulado),
        color: colores.ahorro,
      },
    ],
  };
}
