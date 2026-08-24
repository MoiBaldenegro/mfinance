// REQ-14-02/07: estructura pura para la gráfica Chart.js de balance futuro:
// líneas de activos/pasivos/patrimonio con distinción histórico/proyectado.
// Los colores llegan inyectados (tokens leídos en el componente), para mantener
// este módulo libre de DOM.
import type { BalanceFuturo } from '../entities/pyg-proyeccion.ts';

/** Colores de las series, resueltos desde tokens.css en la UI. */
export interface ColoresBalanceFuturo {
  readonly activos: string;
  readonly pasivos: string;
  readonly patrimonio: string;
  readonly historico: string;
  readonly proyectado: string;
}

export type TipoSerieGrafica = 'linea';

/** Una serie dibujable: nombre, tipo, valores y color. */
export interface SerieGraficaBalanceFuturo {
  readonly nombre: string;
  readonly tipo: TipoSerieGrafica;
  readonly valores: readonly number[];
  readonly color: string;
}

/** Datos completos de la gráfica de balance futuro. */
export interface DatosGraficaBalanceFuturo {
  readonly etiquetas: readonly string[];
  readonly series: readonly SerieGraficaBalanceFuturo[];
}

/**
 * Construye etiquetas y las 3 series alineadas: líneas Activos/Pasivos/Patrimonio
 * con distinción visual histórico vs proyectado.
 */
export function datosDeGraficaBalanceFuturo(
  balance: BalanceFuturo,
  colores: ColoresBalanceFuturo,
): DatosGraficaBalanceFuturo {
  const todasFilas = [...balance.filas_historicas, ...balance.filas_proyectadas];
  
  return {
    etiquetas: todasFilas.map((fila) => fila.mes),
    series: [
      {
        nombre: 'Activos',
        tipo: 'linea',
        valores: todasFilas.map((fila) => fila.activos),
        color: colores.activos,
      },
      {
        nombre: 'Pasivos',
        tipo: 'linea',
        valores: todasFilas.map((fila) => fila.pasivos),
        color: colores.pasivos,
      },
      {
        nombre: 'Patrimonio',
        tipo: 'linea',
        valores: todasFilas.map((fila) => fila.patrimonio),
        color: colores.patrimonio,
      },
    ],
  };
}