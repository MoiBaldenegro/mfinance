// REQ-24-06: datos mínimos para "Saltar onboarding".
import type { Moneda } from '../moneda.ts';
import type { OnboardingStatus } from './onboarding-status.ts';

/** Datos mínimos para "Saltar onboarding" (REQ-24-06). */
export interface PerfilMinimoOnboarding {
  readonly nombre: string;
  readonly moneda: Moneda; // siempre MXN
  readonly onboarding_status: OnboardingStatus; // siempre Completed
}