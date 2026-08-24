// REQ-25-06/09: caso de uso para actualizar paso 2 (balance) del onboarding.
// Reutiliza validaciones de features 8 y 11 vía funciones puras.
import type { OnboardingData, Paso2Data, OnboardingActivo, OnboardingPasivo, OnboardingInversion } from '../../entities/onboarding/index.ts';
import type { OnboardingPort } from '../../ports/onboarding-port.ts';
import { motivoDeRechazoOnboarding, OnboardingDatosError } from '../../errors/onboarding-errors.ts';
import { validarActivo, validarPasivo } from '../balance-validaciones.ts';
import { validarTasa } from '../inversiones-proyeccion.ts';

/** Puertos inyectados por la UI. */
export interface PuertosOnboardingPaso2 {
  readonly onboarding: OnboardingPort;
}

/** Resultado de validar y actualizar datos del paso 2. */
export type ResultadoActualizarPaso2 =
  | { readonly ok: true }
  | { readonly ok: false; readonly aviso: string };

/** Valida un array de activos (REQ-25-02). */
function validarActivos(activos: readonly OnboardingActivo[]): string | undefined {
  for (const activo of activos) {
    const error = validarActivo(activo.nombre, activo.categoria, activo.valor_actual);
    if (error) return error;
  }
  return undefined;
}

/** Valida un array de pasivos (REQ-25-03). */
function validarPasivos(pasivos: readonly OnboardingPasivo[]): string | undefined {
  for (const pasivo of pasivos) {
    const error = validarPasivo(pasivo.nombre, pasivo.saldo_pendiente, pasivo.tasa_interes_anual);
    if (error) return error;
    // Validación adicional: tasa 0-30% (feature 8 no la tenía, la trae feature 11)
    const tasa = validarTasa(pasivo.tasa_interes_anual);
    if (!tasa.valida) return tasa.mensaje;
  }
  return undefined;
}

/** Valida un array de inversiones (REQ-25-04). */
function validarInversiones(inversiones: readonly OnboardingInversion[]): string | undefined {
  for (const inv of inversiones) {
    const tasa = validarTasa(inv.tasa_esperada_anual);
    if (!tasa.valida) return tasa.mensaje;
  }
  return undefined;
}

/** Actualiza los datos del paso 2 (balance) en el onboarding. */
export async function actualizarPaso2Onboarding(
  puertos: PuertosOnboardingPaso2,
  paso2: Paso2Data,
  datosActuales: OnboardingData,
): Promise<ResultadoActualizarPaso2> {
  // Validaciones (REQ-25-02, 25-03, 25-04)
  const errorActivos = validarActivos(paso2.activos);
  if (errorActivos) return { ok: false, aviso: errorActivos };

  const errorPasivos = validarPasivos(paso2.pasivos);
  if (errorPasivos) return { ok: false, aviso: errorPasivos };

  const errorInversiones = validarInversiones(paso2.inversiones);
  if (errorInversiones) return { ok: false, aviso: errorInversiones };

  // Merge con datos actuales (REQ-25-06)
  const nuevosDatos: OnboardingData = {
    ...datosActuales,
    paso2,
  };

  try {
    await puertos.onboarding.actualizarDatos(nuevosDatos);
    return { ok: true };
  } catch (error: unknown) {
    const motivo = motivoDeRechazoOnboarding(error);
    return { ok: false, aviso: new OnboardingDatosError(motivo).message };
  }
}

/** Fachada para el paso 2. */
export const gestionarPaso2Onboarding = {
  actualizar: actualizarPaso2Onboarding,
};