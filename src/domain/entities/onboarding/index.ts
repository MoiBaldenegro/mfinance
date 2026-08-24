// REQ-24-01: barrel export de entidades de onboarding.
export type { OnboardingStatus } from './onboarding-status.ts';
export type {
  OnboardingData,
  ONBOARDING_DATA_VACIO,
} from './onboarding-data.ts';
export type {
  Paso1Data,
  Paso2Data,
  Paso3Data,
  Paso4Data,
  OnboardingActivo,
  OnboardingPasivo,
  OnboardingInversion,
  SupuestoProyeccion,
  UmbralesIndicadores,
} from './onboarding-pasos.ts';
export { paso1DataPorDefecto } from './onboarding-pasos.ts';
export type { PerfilMinimoOnboarding } from './perfil-minimo.ts';
export type { PerfilActivoConOnboarding } from './perfil-activo-con-onboarding.ts';