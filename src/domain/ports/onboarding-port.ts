// REQ-24-01 + REQ-27-03/06/10: puerto del núcleo frontend para onboarding.
// Lo define el dominio (puro, sin frameworks) y lo implementa el adapter
// Tauri IPC; los casos de uso y la UI lo consumen inyectado. Los
// métodos aceptan el perfil_id del backend (opcional: el adapter resuelve
// el activo) para operar sobre el perfil correcto aunque no esté activo.
import type { OnboardingData, OnboardingStatus } from '../entities/onboarding/index.ts';
import type { EntradaMeta, GoalEntry } from '../entities/goal-entry.ts';
import type { Perfil } from '../entities/perfil.ts';

export interface OnboardingPort {
  /** Devuelve el estado actual del onboarding del perfil. */
  obtenerEstado(perfilId?: string): Promise<OnboardingStatus>;
  /** Actualiza los datos parciales del onboarding (merge con existentes). */
  actualizarDatos(datos: OnboardingData, perfilId?: string): Promise<void>;
  /** Completa el onboarding: consolida snapshot/financial_profile y marca Completed. */
  completarOnboarding(perfilId?: string): Promise<Perfil>;
  /** Añade una meta al goals_journal del perfil (REQ-27-03). */
  agregarMeta(perfilId: string | undefined, entrada: EntradaMeta): Promise<GoalEntry>;
  /** Actualiza una meta existente preservando id y creado_en. */
  actualizarMeta(
    perfilId: string | undefined,
    metaId: string,
    entrada: EntradaMeta,
  ): Promise<GoalEntry>;
  /** Elimina una meta del journal por su id (REQ-27-10). */
  eliminarMeta(perfilId: string | undefined, metaId: string): Promise<void>;
}
