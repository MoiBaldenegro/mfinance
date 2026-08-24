// REQ-08-01/02: transformación pura de activos y pasivos a filas
// formateadas para la tabla vía el núcleo multi-moneda (REQ-20-03).
import type { Asset } from '../entities/asset.ts';
import type { Liability } from '../entities/liability.ts';
import type { Moneda } from '../entities/moneda.ts';
import { formatoMoneda } from './formato-moneda.ts';

/** Categoría de activo permitida. */
export type CategoriaActivo = 'liquido' | 'inversion' | 'propiedad';

/** Etiquetas en español para categorías de activo. */
export const CATEGORIA_ACTIVO_LABELS: Readonly<Record<CategoriaActivo, string>> = {
  liquido: 'Líquido',
  inversion: 'Inversión',
  propiedad: 'Propiedad',
} as const;

/** Claves canónicas de categorías de activo (orden de presentación). */
export const CATEGORIAS_ACTIVO_CANONICAS: readonly CategoriaActivo[] = [
  'liquido',
  'inversion',
  'propiedad',
] as const;

/** Fila de activo formateada para la tabla. */
export interface FilaActivo {
  readonly nombre: string;
  readonly categoria: CategoriaActivo;
  readonly categoriaLabel: string;
  readonly valorActual: string; // formateado según la moneda
}

/** Fila de pasivo formateada para la tabla. */
export interface FilaPasivo {
  readonly nombre: string;
  readonly saldoPendiente: string; // formateado según la moneda
  readonly tasaInteresAnual: string; // formateado "X,X %"
}

/** Convierte lista de activos a filas formateadas. */
export function activosAFilas(
  activos: readonly Asset[],
  moneda: Moneda,
): readonly FilaActivo[] {
  return activos.map((activo) => ({
    nombre: activo.nombre,
    categoria: activo.categoria,
    categoriaLabel: CATEGORIA_ACTIVO_LABELS[activo.categoria],
    valorActual: formatoMoneda(activo.valor_actual, moneda),
  }));
}

/** Convierte lista de pasivos a filas formateadas. */
export function pasivosAFilas(
  pasivos: readonly Liability[],
  moneda: Moneda,
): readonly FilaPasivo[] {
  return pasivos.map((pasivo) => ({
    nombre: pasivo.nombre,
    saldoPendiente: formatoMoneda(pasivo.saldo_pendiente, moneda),
    tasaInteresAnual: `${pasivo.tasa_interes_anual.toFixed(1).replace('.', ',')} %`,
  }));
}