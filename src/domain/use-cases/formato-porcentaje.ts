// Porcentajes con el separador decimal de la moneda activa, para que
// «12.5 %» y «$1,200.50» compartan convención en toda la app.
import type { Moneda } from '../entities/moneda.ts';
import { CATALOGO_MONEDAS } from '../entities/moneda.ts';

/** 12.5 → «12.5 %» (MXN/USD) o «12,5 %» (EUR). */
export function formatoPorcentaje(valor: number, moneda: Moneda, decimales = 1): string {
  const separador = CATALOGO_MONEDAS[moneda]?.separador_decimal ?? '.';
  const seguro = Number.isFinite(valor) ? valor : 0;
  return `${seguro.toFixed(decimales).replace('.', separador)} %`;
}
