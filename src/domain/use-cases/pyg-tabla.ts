// REQ-07-02/06: transforma la SeriePyg del backend en filas de tabla con
// cifras del núcleo multi-moneda (REQ-20-03) y estado vacío en español.
import type { FilaPyg, SeriePyg } from '../entities/pyg-serie.ts';
import type { Moneda } from '../entities/moneda.ts';
import { formatoMoneda } from './formato-moneda.ts';

/** Fila lista para renderizar: todos los importes ya formateados. */
export interface FilaTablaPyg {
  readonly mes: string;
  readonly ingresos: string;
  readonly gastos: string;
  readonly utilidad: string;
  readonly ahorroAcumulado: string;
}

/** Mensaje del estado vacío (REQ-07-06): invita al primer registro. */
export const MENSAJE_SIN_REGISTROS =
  'Aún no hay ningún mes registrado. Ve a la sección Registro y captura tus ' +
  'ingresos y gastos de tu primer mes para ver aquí tu P&G.';

/** IF no hay registros THEN la sección muestra el estado vacío. */
export function serieVacia(serie: SeriePyg): boolean {
  return serie.filas.length === 0;
}

function filaDeTabla(fila: FilaPyg, moneda: Moneda): FilaTablaPyg {
  return {
    mes: fila.mes,
    ingresos: formatoMoneda(fila.ingresos, moneda),
    gastos: formatoMoneda(fila.gastos, moneda),
    utilidad: formatoMoneda(fila.utilidad, moneda),
    ahorroAcumulado: formatoMoneda(fila.ahorro_acumulado, moneda),
  };
}

/** Filas formateadas de la tabla, en el orden recibido del backend. */
export function filasDeTabla(serie: SeriePyg, moneda: Moneda): FilaTablaPyg[] {
  return serie.filas.map((fila) => filaDeTabla(fila, moneda));
}
