// REQ-19-04/05: núcleo de formateo monetario determinista multi-moneda.
// PUNTO ÚNICO de formateo de la app desde la F20: manual y puro, sin
// motores nativos de formateo regional ni dependencias nuevas; cadenas
// estables entre entornos y tests.
import type { Moneda } from '../entities/moneda.ts';
import { CATALOGO_MONEDAS } from '../entities/moneda.ts';
import { MonedaFueraCatalogoError } from '../errors/moneda-errors.ts';

/**
 * Formatea un importe según la divisa del catálogo. `decimales = 0`
 * cubre la variante sin decimales de inversiones. Lanza
 * MonedaFueraCatalogoError si la moneda no pertenece al catálogo.
 */
export function formatoMoneda(
  valor: number,
  moneda: Moneda,
  decimales = 2,
): string {
  const info = CATALOGO_MONEDAS[moneda];
  if (!info) {
    throw new MonedaFueraCatalogoError(String(moneda));
  }
  const negativo = valor < 0;
  const fijado = Math.abs(valor).toFixed(decimales);
  const [entera, decimal] = fijado.split('.');
  const conMiles =
    entera.replace(/\B(?=(\d{3})+(?!\d))/g, info.separador_miles);
  const cuerpo =
    decimal === undefined
      ? conMiles
      : `${conMiles}${info.separador_decimal}${decimal}`;
  const signo = negativo ? '-' : '';
  return info.simbolo_antes
    ? `${signo}${info.simbolo}${cuerpo}`
    : `${signo}${cuerpo} ${info.simbolo}`;
}
