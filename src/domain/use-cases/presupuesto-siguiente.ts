// REQ-16-02: presupuesto del mes siguiente: pre-relleno con el promedio
// móvil sugerido, total en vivo y construcción de la petición validada.
import { EXPENSE_CATEGORIES } from '../entities/catalogs.ts';
import type { Presupuesto } from '../entities/cierre.ts';
import { parseMonthKey } from '../entities/month-key.ts';
import type { ErrorCampo } from './validacion-importes.ts';
import {
  numeroSeguro,
  validarCamposImporte,
  type CampoImporte,
} from './validacion-importes.ts';

/** Texto editable de un importe: coma decimal, sin ceros colgantes. */
function textoImporte(valor: number): string {
  return String(Number(valor.toFixed(2))).replace('.', ',');
}

/**
 * Pre-rellena los textos por categoría con la sugerencia del backend
 * (promedio móvil de los últimos tres meses registrados).
 */
export function textosDesdeSugerido(
  sugerido: Presupuesto,
): Record<string, string> {
  return Object.fromEntries(
    EXPENSE_CATEGORIES.map((clave) => [
      clave,
      clave in sugerido ? textoImporte(sugerido[clave] ?? 0) : '',
    ]),
  );
}

/** Total del presupuesto recalculado EN VIVO desde los textos. */
export function totalPresupuesto(textos: Readonly<Record<string, string>>): number {
  return EXPENSE_CATEGORIES.reduce(
    (total, clave) => total + numeroSeguro(textos[clave] ?? ''),
    0,
  );
}

export type ResultadoPresupuesto =
  | { readonly ok: true; readonly presupuesto: Presupuesto }
  | { readonly ok: false; readonly errores: readonly ErrorCampo[] };

/** Valida mes y textos; construye el mapa del cable omitiendo vacíos/ceros. */
export function construirPresupuesto(
  mes: string,
  textos: Readonly<Record<string, string>>,
): ResultadoPresupuesto {
  try {
    parseMonthKey(mes);
  } catch {
    return {
      ok: false,
      errores: [{ clave: '__mes__', mensaje: 'Mes inválido: se espera el formato AAAA-MM.' }],
    };
  }
  const campos: CampoImporte[] = EXPENSE_CATEGORIES.map((clave) => ({
    clave: `gasto:${clave}`,
    etiqueta: clave,
    texto: textos[clave] ?? '',
  }));
  const errores = validarCamposImporte(campos);
  if (errores.length > 0) return { ok: false, errores };
  const pares: Array<[string, number]> = [];
  for (const clave of EXPENSE_CATEGORIES) {
    const valor = numeroSeguro(textos[clave] ?? '');
    if (valor !== 0) pares.push([clave, valor]);
  }
  return { ok: true, presupuesto: Object.fromEntries(pares) };
}
