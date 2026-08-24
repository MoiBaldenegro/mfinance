// REQ-14-03/04/07: estructura pura para la gráfica Chart.js de proyección:
// líneas de ingresos/gastos/utilidad/patrimonio con distinción histórico/proyectado.
// Los colores llegan inyectados (tokens leídos en el componente), para mantener
// este módulo libre de DOM.
import type { ProyeccionPyg } from '../entities/pyg-proyeccion.ts';

/** Colores de las series, resueltos desde tokens.css en la UI. */
export interface ColoresProyeccion {
  readonly ingresos: string;
  readonly gastos: string;
  readonly utilidad: string;
  readonly patrimonio: string;
  readonly historico: string;   // color base para histórico (opacidad completa)
  readonly proyectado: string;  // color base para proyectado (con alpha)
}

export type TipoSerieGrafica = 'linea';

/** Una serie dibujable: nombre, tipo, valores y color. */
export interface SerieGraficaProyeccion {
  readonly nombre: string;
  readonly tipo: TipoSerieGrafica;
  readonly valores: readonly number[];
  readonly color: string;
}

/** Datos completos de la gráfica de proyección. */
export interface DatosGraficaProyeccion {
  readonly etiquetas: readonly string[];
  readonly series: readonly SerieGraficaProyeccion[];
}

/**
 * Construye etiquetas y las 4 series alineadas: líneas Ingresos/Gastos/Utilidad/Patrimonio
 * con distinción visual histórico vs proyectado mediante color/opacidad.
 */
export function datosDeGraficaProyeccion(
  proyeccion: ProyeccionPyg,
  colores: ColoresProyeccion,
): DatosGraficaProyeccion {
  const todasFilas = [...proyeccion.filas_historicas, ...proyeccion.filas_proyectadas];

  return {
    etiquetas: todasFilas.map((fila) => fila.mes),
    series: [
      {
        nombre: 'Ingresos',
        tipo: 'linea',
        valores: todasFilas.map((fila) => fila.ingresos),
        color: colores.ingresos,
      },
      {
        nombre: 'Gastos',
        tipo: 'linea',
        valores: todasFilas.map((fila) => fila.gastos),
        color: colores.gastos,
      },
      {
        nombre: 'Utilidad',
        tipo: 'linea',
        valores: todasFilas.map((fila) => fila.utilidad),
        color: colores.utilidad,
      },
      {
        nombre: 'Patrimonio',
        tipo: 'linea',
        valores: todasFilas.map((fila) => fila.ahorro_acumulado),
        color: colores.patrimonio,
      },
    ],
  };
}