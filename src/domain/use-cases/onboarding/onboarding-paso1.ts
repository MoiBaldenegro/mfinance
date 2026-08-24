// Lógica paso 1: actualizar datos personales, moneda, fuentes, categorías
import type { Paso1Data } from '../../entities/onboarding/index.ts';
import type { OnboardingData } from '../../entities/onboarding/index.ts';

export function actualizarPaso1(
  pasoActual: Paso1Data,
  datos: OnboardingData,
  campo: keyof Paso1Data,
  valor: Paso1Data[keyof Paso1Data],
): OnboardingData {
  const nuevoPaso1: Paso1Data = { ...pasoActual, [campo]: valor };
  return { ...datos, paso1: nuevoPaso1 };
}