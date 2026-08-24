// Lógica paso 2: actualizar balance (activos, pasivos, inversiones)
import type { Paso2Data } from '../../entities/onboarding/index.ts';
import type { OnboardingData } from '../../entities/onboarding/index.ts';

export function actualizarPaso2(
  datos: OnboardingData,
  paso2: Paso2Data,
): OnboardingData {
  return { ...datos, paso2 };
}