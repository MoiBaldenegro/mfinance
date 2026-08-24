// REQ-24-06 + REQ-27-06/08: completar y saltar el onboarding.
// Ambos aceptan el perfil_id (el adapter resuelve el activo si falta).
// La consolidación real (StrategySettings, Investment.tasa_esperada,
// financial_profile, status=Completed) la ejecuta el backend; este caso
// de uso delega en el puerto y traduce fallos a avisos en español.
import type { Paso1Data, OnboardingData } from '../../entities/onboarding/index.ts';
import type { Perfil } from '../../entities/perfil.ts';
import type { OnboardingPort } from '../../ports/onboarding-port.ts';
import { gestionarOnboarding } from './gestionar-onboarding.ts';

export interface PuertosOnboarding {
  readonly onboarding: OnboardingPort;
}

/** Resultado de finalizar el onboarding. */
export type ResultadoCompletar =
  | { readonly ok: true; readonly perfil: Perfil }
  | { readonly ok: false; readonly aviso: string };

/** Finaliza el onboarding del perfil (botón «Finalizar onboarding»). */
export async function completarOnboarding(
  puertos: PuertosOnboarding,
  perfilId?: string,
): Promise<ResultadoCompletar> {
  try {
    const perfil = await puertos.onboarding.completarOnboarding(perfilId);
    return { ok: true, perfil };
  } catch (error: unknown) {
    return { ok: false, aviso: `no se pudo completar el onboarding: ${texto(error)}` };
  }
}

/** Salta el onboarding creando el perfil mínimo (REQ-27-08). */
export async function saltarOnboarding(
  puertos: PuertosOnboarding,
  pasoActual: Pick<Paso1Data, 'nombre_completo'> | undefined,
  perfilId?: string,
): Promise<{ ok: true } | { ok: false; aviso: string }> {
  const minimos: OnboardingData = {
    paso1: {
      nombre_completo: pasoActual?.nombre_completo?.trim() || 'Usuario',
      moneda: 'MXN',
      fuentes_ingreso_activas: ['salario'],
      categorias_gasto_usadas: ['vivienda'],
    },
    paso2: null, paso3: null, paso4: null,
  };
  try {
    await gestionarOnboarding.actualizarDatos(puertos, minimos, perfilId);
    await puertos.onboarding.completarOnboarding(perfilId);
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, aviso: `no se pudo crear el perfil mínimo: ${texto(error)}` };
  }
}

function texto(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'mensaje' in error) {
    return String((error as { mensaje: unknown }).mensaje);
  }
  return error instanceof Error ? error.message : String(error);
}
