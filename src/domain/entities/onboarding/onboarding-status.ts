// REQ-24-01: estado del onboarding del perfil.
// Espejo de src-tauri/src/domain/onboarding/status.rs. Sin imports externos.

/** Estado del onboarding del perfil (REQ-24-01). */
export type OnboardingStatus =
  | { readonly nombre: 'NotStarted' }
  | { readonly nombre: 'InProgress'; readonly current_step: number }
  | { readonly nombre: 'Completed' };