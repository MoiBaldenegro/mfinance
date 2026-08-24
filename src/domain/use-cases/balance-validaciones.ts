// REQ-08-06: validaciones puras para activos y pasivos que rechazan
// valores negativos con mensajes en español, sin persistir.
import type { CategoriaActivo } from './balance-tabla.ts';

/** Error cuando el valor actual de un activo es negativo. */
export const ERROR_VALOR_NEGATIVO_ACTIVO =
  'El valor del activo no puede ser negativo.';

/** Error cuando el saldo pendiente de un pasivo es negativo. */
export const ERROR_SALDO_NEGATIVO_PASIVO =
  'El saldo pendiente no puede ser negativo.';

/** Error cuando la tasa de interés anual de un pasivo es negativa. */
export const ERROR_TASA_NEGATIVA_PASIVO =
  'La tasa de interés anual no puede ser negativa.';

/** Valida un activo: rechaza valor negativo. */
export function validarActivo(
  _nombre: string,
  _categoria: CategoriaActivo,
  valorActual: number,
): string | undefined {
  if (valorActual < 0) return ERROR_VALOR_NEGATIVO_ACTIVO;
  return undefined;
}

/** Valida un pasivo: rechaza saldo o tasa negativos. */
export function validarPasivo(
  _nombre: string,
  saldoPendiente: number,
  tasaInteresAnual: number,
): string | undefined {
  if (saldoPendiente < 0) return ERROR_SALDO_NEGATIVO_PASIVO;
  if (tasaInteresAnual < 0) return ERROR_TASA_NEGATIVA_PASIVO;
  return undefined;
}