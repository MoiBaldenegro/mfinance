// REQ-08-05: estructura pura para la gráfica Chart.js de evolución
// del patrimonio: línea superpuesta del patrimonio mensual.
// Los colores llegan inyectados (tokens leídos en el componente).
import type { SerieBalance } from '../entities/balance-serie.ts';

/** Colores de las series, resueltos desde tokens.css en la UI. */
export interface ColoresBalance {
  readonly patrimonio: string;
}

export type TipoSerieBalance = 'linea';

/** Una serie dibujable: nombre, tipo (línea), valores y color. */
export interface SerieBalanceGrafica {
  readonly nombre: string;
  readonly tipo: TipoSerieBalance;
  readonly valores: readonly number[];
  readonly color: string;
}

/** Datos completos de la gráfica de evolución patrimonial. */
export interface DatosGraficaBalance {
  readonly etiquetas: readonly string[];
  readonly series: readonly SerieBalanceGrafica[];
}

/**
 * Construye etiquetas y la serie de patrimonio alineada con la
 * ordenación del backend: línea de patrimonio mensual.
 */
export function datosDeGraficaBalance(
  serie: SerieBalance,
  colores: ColoresBalance,
): DatosGraficaBalance {
  const filas = serie.filas;
  return {
    etiquetas: filas.map((fila) => fila.mes),
    series: [
      {
        nombre: 'Patrimonio',
        tipo: 'linea',
        valores: filas.map((fila) => fila.patrimonio),
        color: colores.patrimonio,
      },
    ],
  };
}