// REQ-26-01/08/10: Lógica paso 3: deuda y proyección.
// Actualiza onboarding_data.deuda (estrategia, pago extra) y onboarding_data.proyeccion (supuestos).
// Puro, sin framework ni invocaciones IPC.
import type { Paso3Data } from '../../entities/onboarding/index.ts';
import type { OnboardingData } from '../../entities/onboarding/index.ts';

/** Actualiza los datos del paso 3 (deuda y proyección) en el onboarding. */
export function actualizarPaso3(
  datos: OnboardingData,
  paso3: Paso3Data,
): OnboardingData {
  return { ...datos, paso3 };
}

/** Crea Paso3Data por defecto: Avalancha, pago extra 0, supuestos vacíos. */
export function paso3DataPorDefecto(): Paso3Data {
  return {
    estrategia_deuda: 'Avalanche',
    pago_extra_mensual: 0,
    supuestos_proyeccion: [],
  };
}