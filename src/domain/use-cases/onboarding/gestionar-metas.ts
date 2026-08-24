// REQ-27-03/10: caso de uso del journal de metas. Valida con las
// reglas del dominio (coincidentes con el backend, REQ-23-11) ANTES de
// llamar al puerto; los errores técnicos llegan como aviso en español.
import type { EntradaMeta, GoalEntry } from '../../entities/goal-entry.ts';
import { validarMeta } from '../../entities/goal-entry.ts';
import type { OnboardingPort } from '../../ports/onboarding-port.ts';

/** Puertos inyectados por la UI (mismo puerto que el resto del wizard). */
export interface PuertosMetas {
  readonly onboarding: OnboardingPort;
}

/** Resultado de agregar/actualizar una meta. */
export type ResultadoMeta =
  | { readonly ok: true; readonly meta: GoalEntry }
  | {
      readonly ok: false;
      readonly aviso?: string;
      readonly avisos?: readonly ReturnType<typeof validarMeta>[number][];
    };

/** Resultado de eliminar una meta. */
export type ResultadoBaja = { readonly ok: true } | { readonly ok: false; readonly aviso: string };

/** Añade una meta validada al goals_journal del perfil. */
export async function agregarMeta(
  puertos: PuertosMetas,
  perfilId: string | undefined,
  entrada: EntradaMeta,
): Promise<ResultadoMeta> {
  const avisos = validarMeta(entrada);
  if (avisos.length > 0) return { ok: false, avisos };
  try {
    const meta = await puertos.onboarding.agregarMeta(perfilId, entrada);
    return { ok: true, meta };
  } catch (error: unknown) {
    return { ok: false, aviso: `no se pudo guardar la meta: ${texto(error)}` };
  }
}

/** Actualiza una meta existente tras validar la nueva versión. */
export async function actualizarMeta(
  puertos: PuertosMetas,
  perfilId: string | undefined,
  metaId: string,
  entrada: EntradaMeta,
): Promise<ResultadoMeta> {
  const avisos = validarMeta(entrada);
  if (avisos.length > 0) return { ok: false, avisos };
  try {
    const meta = await puertos.onboarding.actualizarMeta(perfilId, metaId, entrada);
    return { ok: true, meta };
  } catch (error: unknown) {
    return { ok: false, aviso: `no se pudo guardar la meta: ${texto(error)}` };
  }
}

/** Elimina una meta por id; propaga el motivo si falla. */
export async function eliminarMeta(
  puertos: PuertosMetas,
  perfilId: string | undefined,
  metaId: string,
): Promise<ResultadoBaja> {
  try {
    await puertos.onboarding.eliminarMeta(perfilId, metaId);
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, aviso: texto(error) };
  }
}

function texto(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'mensaje' in error) {
    return String((error as { mensaje: unknown }).mensaje);
  }
  return error instanceof Error ? error.message : String(error);
}
