// REQ-09-05: datasets de la gráfica Chart.js para el plan de deuda:
// barras de pagos (principal + intereses) + línea de saldo restante.
// Los colores llegan inyectados (tokens leídos en el componente).
import type { ProyeccionDeuda } from '../entities/plan-deuda.ts';

/** Colores de las series, resueltos desde tokens.css en la UI. */
export interface ColoresDeuda {
  readonly pago: string;
  readonly interes: string;
  readonly saldo: string;
}

export type TipoSerieDeuda = 'barra' | 'linea';

/** Una serie dibujable: nombre, tipo (barra|línea), valores y color. */
export interface SerieGraficaDeuda {
  readonly nombre: string;
  readonly tipo: TipoSerieDeuda;
  readonly valores: readonly number[];
  readonly color: string;
  readonly yAxisID?: 'y' | 'y1';
}

/** Datos completos de la gráfica de deuda. */
export interface DatosGraficaDeuda {
  readonly etiquetas: readonly string[];
  readonly series: readonly SerieGraficaDeuda[];
}

/**
 * Construye etiquetas y series alineadas con la proyección:
 * - Barras apiladas: Principal e Intereses por mes
 * - Línea: Saldo restante
 */
export function datosDeGraficaDeuda(
  proyeccion: ProyeccionDeuda,
  colores: ColoresDeuda,
): DatosGraficaDeuda {
  const filas = proyeccion.filas;
  return {
    etiquetas: filas.map((fila) => String(fila.mes)),
    series: [
      {
        nombre: 'Principal',
        tipo: 'barra' as const,
        valores: filas.map((fila) => fila.principal_mes),
        color: colores.pago,
        yAxisID: 'y' as const,
      },
      {
        nombre: 'Intereses',
        tipo: 'barra' as const,
        valores: filas.map((fila) => fila.intereses_mes),
        color: colores.interes,
        yAxisID: 'y' as const,
      },
      {
        nombre: 'Saldo restante',
        tipo: 'linea' as const,
        valores: filas.map((fila) => fila.saldo_total_restante),
        color: colores.saldo,
        yAxisID: 'y1' as const,
      },
    ],
  };
}