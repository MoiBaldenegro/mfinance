// REQ-24-01/05: datos parciales del wizard de onboarding.
// Espejo de src-tauri/src/domain/onboarding/data.rs. Sin imports externos.
import type { Paso1Data } from './onboarding-pasos.ts';
import type { Paso2Data } from './onboarding-pasos.ts';
import type { Paso3Data } from './onboarding-pasos.ts';
import type { Paso4Data } from './onboarding-pasos.ts';

/** Datos parciales capturados durante el wizard (REQ-24-05). */
export interface OnboardingData {
  readonly paso1: Paso1Data | null;
  readonly paso2: Paso2Data | null;
  readonly paso3: Paso3Data | null;
  readonly paso4: Paso4Data | null;
}

/** OnboardingData vacío por defecto. */
export const ONBOARDING_DATA_VACIO: OnboardingData = {
  paso1: null,
  paso2: null,
  paso3: null,
  paso4: null,
};