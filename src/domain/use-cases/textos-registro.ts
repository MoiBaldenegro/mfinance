// Mapeo puro entre los montos de un MonthlyRecord y los textos de los
// inputs del formulario: un mes sin registro abre a ceros (REQ-06-08).
import { EXPENSE_CATEGORIES, INCOME_SOURCES } from '../entities/catalogs.ts';

/** Textos tecleados indexados por clave de catálogo. */
export type Textos = Record<string, string>;

/** Textos del formulario para unos valores dados; ausentes quedan ''. */
export function textosDesde(
  valores: Partial<Record<string, number>> | undefined,
  claves: readonly string[],
): Textos {
  const textos: Textos = {};
  for (const clave of claves) {
    const valor = valores?.[clave];
    textos[clave] = typeof valor === 'number' ? String(valor) : '';
  }
  return textos;
}

/** Par de mapas de texto (ingresos y gastos) para el mes indicado. */
export function textosDelMes(
  registro:
    | {
        readonly ingresos: Partial<Record<string, number>>;
        readonly gastos: Partial<Record<string, number>>;
      }
    | undefined,
): { ingresos: Textos; gastos: Textos } {
  return {
    ingresos: textosDesde(registro?.ingresos, INCOME_SOURCES),
    gastos: textosDesde(registro?.gastos, EXPENSE_CATEGORIES),
  };
}
