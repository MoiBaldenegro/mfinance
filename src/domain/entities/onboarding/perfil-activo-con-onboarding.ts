// REQ-29-01: respuesta combinada del backend para el gate de arranque.
// Espejo de PerfilActivoConOnboardingResponse de src-tauri.
import type { FinanceSnapshot } from '../finance-snapshot.ts';
import type { OnboardingStatus } from './onboarding-status.ts';

export interface PerfilActivoConOnboarding {
  readonly snapshot: FinanceSnapshot;
  readonly onboarding_status: OnboardingStatus;
}