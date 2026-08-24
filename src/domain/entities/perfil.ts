// REQ-22-01, REQ-23-01: espejo TS de la entidad Perfil de
// src-tauri/src/domain/perfil.rs tal cual cruza el IPC (snake_case).
// Un perfil identifica al titular cuyos datos están aislados bajo su id.
// Incluye estado de onboarding, datos parciales y journal de metas.
import type { OnboardingStatus, OnboardingData } from '../entities/onboarding/index.ts';
import type { GoalEntry } from '../entities/goal-entry.ts';

/** Un titular con identidad propia y datos aislados en el backend. */
export interface Perfil {
  /** Identificador único con esquema `p_<hex>` generado por el backend. */
  readonly id: string;
  /** Nombre visible del titular. */
  readonly nombre: string;
  /** Fecha de creación ISO-8601 UTC (la genera el backend). */
  readonly creado_en: string;
  /** Estado del onboarding del perfil (REQ-23-01). */
  readonly onboarding_status: OnboardingStatus;
  /** Datos parciales del wizard de onboarding (REQ-23-02). */
  readonly onboarding_data: OnboardingData;
  /** Journal de metas del titular (REQ-23-03, REQ-27-10). */
  readonly goals_journal?: readonly GoalEntry[];
}
