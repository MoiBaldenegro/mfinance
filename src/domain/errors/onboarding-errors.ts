// REQ-24-02: errores nombrados de onboarding (español, coinciden con backend).
// Mismo patrón que snapshot-errors.ts: usa errorDesdeCodigoIpc para mapear códigos.

/** Fallo al obtener el estado del onboarding. */
export class OnboardingStatusError extends Error {
  constructor(motivo: string) {
    super(`no se pudo cargar el estado del onboarding: ${motivo}`);
    this.name = 'OnboardingStatusError';
  }
}

/** Fallo al guardar el progreso del onboarding. */
export class OnboardingDatosError extends Error {
  constructor(motivo: string) {
    super(`no se pudo guardar el progreso del onboarding: ${motivo}`);
    this.name = 'OnboardingDatosError';
  }
}

/** Fallo al completar el onboarding. */
export class OnboardingCompletarError extends Error {
  constructor(motivo: string) {
    super(`no se pudo completar el onboarding: ${motivo}`);
    this.name = 'OnboardingCompletarError';
  }
}

/**
 * Extrae el motivo legible de un rechazo IPC: los commands devuelven
 * CommandError { codigo, mensaje } ya redactado en español; cualquier
 * otra cosa se describe por su mensaje o representación.
 */
export function motivoDeRechazoOnboarding(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const candidato = error as { mensaje?: unknown };
    if (
      typeof candidato.mensaje === 'string' && candidato.mensaje.length > 0
    ) {
      return candidato.mensaje;
    }
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return String(error);
}

/** Códigos nombrados que envía el backend en CommandError.codigo. */
const CODIGOS_ONBOARDING = {
  status: 'OnboardingStatusError',
  datos: 'OnboardingDatosError',
  completar: 'OnboardingCompletarError',
} as const;

/**
 * Convierte un rechazo IPC en el error nombrado correspondiente según el código.
 * Recibe el código extraído del error y el motivo legible.
 */
export function errorOnboardingDesdeRechazo(codigo: unknown, rechazo: unknown): Error {
  const motivo = motivoDeRechazoOnboarding(rechazo);
  if (codigo === CODIGOS_ONBOARDING.status) return new OnboardingStatusError(motivo);
  if (codigo === CODIGOS_ONBOARDING.datos) return new OnboardingDatosError(motivo);
  if (codigo === CODIGOS_ONBOARDING.completar) return new OnboardingCompletarError(motivo);
  // Por defecto tratamos como error de estado (operación más común al leer)
  return new OnboardingStatusError(motivo);
}