// REQ-24-03: caso de uso gestionarOnboarding. Orquesta obtener estado,
// actualizar datos parciales y completar onboarding usando OnboardingPort.
// Puro, sin framework ni invocaciones IPC.
import type { OnboardingData, OnboardingStatus } from '../../entities/onboarding/index.ts';
import type { Perfil } from '../../entities/perfil.ts';
import type { OnboardingPort } from '../../ports/onboarding-port.ts';
import { motivoDeRechazoOnboarding, OnboardingDatosError, OnboardingCompletarError, OnboardingStatusError } from '../../../domain/errors/onboarding-errors.ts';

/** Puertos inyectados por la UI. */
export interface PuertosOnboarding {
  readonly onboarding: OnboardingPort;
}

/** Resultado de obtener estado. */
export type ResultadoEstadoOnboarding = OnboardingStatus | Error;

/** Obtiene el estado del onboarding del perfil activo. */
export async function obtenerEstadoOnboarding(
  puertos: PuertosOnboarding,
  perfilId?: string,
): Promise<ResultadoEstadoOnboarding> {
  try {
    return await puertos.onboarding.obtenerEstado(perfilId);
  } catch (error: unknown) {
    const motivo = motivoDeRechazoOnboarding(error);
    return new OnboardingStatusError(motivo);
  }
}

/** Resultado de actualizar datos. */
export type ResultadoActualizarOnboarding =
  | { readonly ok: true }
  | { readonly ok: false; readonly aviso: string };

/** Actualiza los datos parciales del onboarding (merge con existentes). */
export async function actualizarDatosOnboarding(
  puertos: PuertosOnboarding,
  datos: OnboardingData,
  perfilId?: string,
): Promise<ResultadoActualizarOnboarding> {
  try {
    // Merge con datos actuales del puerto (el hook pasa los datos actuales)
    // El merge se hace en el hook antes de llamar a actualizarDatos
    await puertos.onboarding.actualizarDatos(datos, perfilId);
    return { ok: true };
  } catch (error: unknown) {
    const motivo = motivoDeRechazoOnboarding(error);
    return { ok: false, aviso: new OnboardingDatosError(motivo).message };
  }
}

/** Resultado de completar onboarding. */
export type ResultadoCompletarOnboarding =
  | { readonly ok: true; readonly perfil: Perfil }
  | { readonly ok: false; readonly aviso: string };

/** Completa el onboarding: consolida y marca Completed. */
export async function completarOnboarding(
  puertos: PuertosOnboarding,
  perfilId?: string,
): Promise<ResultadoCompletarOnboarding> {
  try {
    const perfil = await puertos.onboarding.completarOnboarding(perfilId);
    return { ok: true, perfil };
  } catch (error: unknown) {
    const motivo = motivoDeRechazoOnboarding(error);
    return { ok: false, aviso: new OnboardingCompletarError(motivo).message };
  }
}

/** Fachada única que exporta todas las operaciones (patrón otros use-cases). */
export const gestionarOnboarding = {
  obtenerEstado: obtenerEstadoOnboarding,
  actualizarDatos: actualizarDatosOnboarding,
  completar: completarOnboarding,
};