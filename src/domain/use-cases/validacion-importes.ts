// Validación de importes del formulario mensual (REQ-06-06): parseo
// tolerante con coma decimal, rechazo nombrado de negativos y no
// numéricos, y recopilación campo a campo para el error inline.
import {
  ImporteNegativoError,
  ImporteNoNumericoError,
} from '../errors/importe-errors.ts';

/** Un campo del formulario: clave estable, rótulo y texto tecleado. */
export interface CampoImporte {
  readonly clave: string;
  readonly etiqueta: string;
  readonly texto: string;
}

/** Error de validación asociado a la clave de un campo concreto. */
export interface ErrorCampo {
  readonly clave: string;
  readonly mensaje: string;
}

/**
 * Convierte el texto tecleado en euros: vacío = cero, coma decimal
 * admitida; lo no numérico o negativo lanza su error nombrado.
 */
export function parsearImporte(texto: string): number {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '') return 0;
  const valor = Number(limpio);
  if (!Number.isFinite(valor)) throw new ImporteNoNumericoError(texto);
  if (valor < 0) throw new ImporteNegativoError(texto);
  return valor;
}

/**
 * Como parsearImporte pero nunca lanza: devuelve 0 ante texto no
 * numérico. Mantiene los negativos para la vista previa EN VIVO; el
 * bloqueo de guardado corresponde a validarCamposImporte (REQ-06-06).
 */
export function numeroSeguro(texto: string): number {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '') return 0;
  const valor = Number(limpio);
  return Number.isFinite(valor) ? valor : 0;
}

/**
 * Intenta validar cada campo y devuelve solo los inválidos con su
 * mensaje en español listo para pintarse junto al campo afectado.
 */
export function validarCamposImporte(
  campos: readonly CampoImporte[],
): ErrorCampo[] {
  const errores: ErrorCampo[] = [];
  for (const campo of campos) {
    try {
      parsearImporte(campo.texto);
    } catch (error: unknown) {
      errores.push({ clave: campo.clave, mensaje: (error as Error).message });
    }
  }
  return errores;
}

/** Mapa clave→mensaje listo para el error inline por campo. */
export function erroresPorClave(
  errores: readonly ErrorCampo[],
): Record<string, string> {
  return Object.fromEntries(errores.map((error) => [error.clave, error.mensaje]));
}

/** Mensaje del primer error global (p. ej. mes o guardado) o null. */
export function avisoGlobal(
  errores: readonly ErrorCampo[],
  clavesGlobales: readonly string[],
): string | null {
  return errores.find((error) => clavesGlobales.includes(error.clave))
    ?.mensaje ?? null;
}

