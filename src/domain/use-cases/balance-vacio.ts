// REQ-08-05: detección de estado vacío y mensaje en español para
// la sección Balance cuando no hay patrimonio que graficar.
import type { SerieBalance } from '../entities/balance-serie.ts';

/** Mensaje mostrado cuando no hay datos de patrimonio para graficar. */
export const MENSAJE_SIN_PATRIMONIO =
  'Aún no hay datos de patrimonio. Crea tu primer activo o pasivo en la sección Balance.';

/** Indica si la serie de balance está vacía (sin filas). */
export function estaVacio(serie: SerieBalance): boolean {
  return serie.filas.length === 0;
}