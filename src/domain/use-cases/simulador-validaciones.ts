// REQ-15-05: validación del formulario del simulador ANTES de llamar al
// IPC. Mensajes en español; lógica pura sin React ni transporte. Los
// parsers de texto crudo viven en simulador-formulario.
import type { ExtraordinarioPuntual } from '../entities/simulador-credito.ts';

/** Datos mínimos que el formulario debe validar para calcular. */
export interface PeticionFormulario {
  readonly importe: number;
  readonly plazoMeses: number;
  readonly tasaInteresAnual: number;
}

/** Resultado de una validación: acepta o rechaza con motivo en español. */
export type ResultadoValidacion =
  | { readonly ok: true }
  | { readonly ok: false; readonly mensaje: string };

const ACEPTADA: ResultadoValidacion = { ok: true };

/** Rechaza importe no positivo, plazo cero y tasa negativa (REQ-15-05). */
export function validarPeticionSimulacion(
  peticion: PeticionFormulario,
): ResultadoValidacion {
  if (!Number.isFinite(peticion.importe) || peticion.importe <= 0) {
    return {
      ok: false,
      mensaje: 'El importe debe ser mayor que cero euros.',
    };
  }
  if (
    !Number.isFinite(peticion.plazoMeses)
    || peticion.plazoMeses <= 0
    || !Number.isInteger(peticion.plazoMeses)
  ) {
    return { ok: false, mensaje: 'El plazo debe ser mayor que cero meses.' };
  }
  if (!Number.isFinite(peticion.tasaInteresAnual) || peticion.tasaInteresAnual < 0) {
    return { ok: false, mensaje: 'La tasa de interés no puede ser negativa.' };
  }
  return ACEPTADA;
}

/** Valida un extraordinario puntual entre el mes 1 y el plazo. */
export function validarExtraordinario(
  mes: number,
  importe: number,
  plazoMeses: number,
): ResultadoValidacion {
  const fueraDeRango = !Number.isInteger(mes) || mes < 1 || mes > plazoMeses;
  if (fueraDeRango || !Number.isFinite(importe) || importe <= 0) {
    return {
      ok: false,
      mensaje:
        'El pago extraordinario debe aplicarse entre el mes 1 y el plazo con importe mayor que cero.',
    };
  }
  return ACEPTADA;
}

/** Convierte la lista editable del formulario a los extras del cable. */
export function extrasDesdeFormulario(
  extraMensual: number,
  extraordinarios: readonly ExtraordinarioPuntual[],
  plazoMeses: number,
): ResultadoValidacion & { readonly extras?: ExtrasCable } {
  for (const extraordinario of extraordinarios) {
    const valido = validarExtraordinario(extraordinario.mes, extraordinario.importe, plazoMeses);
    if (!valido.ok) return valido;
  }
  if (!Number.isFinite(extraMensual) || extraMensual < 0) {
    return { ok: false, mensaje: 'El pago extra mensual no puede ser negativo.' };
  }
  return { ok: true, extras: { extra_mensual: extraMensual, extraordinarios } };
}

/** Extras en formato de cable serde. */
export interface ExtrasCable {
  readonly extra_mensual: number;
  readonly extraordinarios: readonly ExtraordinarioPuntual[];
}
