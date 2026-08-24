// REQ-24-02 + REQ-27-03/06/10 + REQ-31-01/02: adapter Tauri IPC del
// puerto OnboardingPort. Junto a snapshot-ipc-adapter y perfil-ipc-adapter
// es el ÚNICO módulo del frontend que invoca invoke(): expone
// obtener_onboarding_status, actualizar_perfil_onboarding,
// completar_onboarding y agregar/actualizar/eliminar_meta. El backend
// exige perfilId (camelCase por defecto de Tauri 2): si el llamador no
// lo aporta se resuelve el perfil ACTIVO aquí (capa de adapters, jamás en UI).
import { invoke } from '@tauri-apps/api/core';
import type { OnboardingData, OnboardingStatus } from '../domain/entities/onboarding/index.ts';
import type { EntradaMeta, GoalEntry } from '../domain/entities/goal-entry.ts';
import type { Perfil } from '../domain/entities/perfil.ts';
import type { OnboardingPort } from '../domain/ports/onboarding-port.ts';
import { errorOnboardingDesdeRechazo } from '../domain/errors/onboarding-errors.ts';

/** Llama a un command y convierte cualquier rechazo en error nombrado. */
async function llamar<T>(
  comando: string,
  argumentos?: Record<string, unknown>,
): Promise<T> {
  try {
    return await invoke<T>(comando, argumentos);
  } catch (error: unknown) {
    const codigo = typeof error === 'object' && error !== null
      ? (error as { codigo?: unknown }).codigo
      : undefined;
    throw errorOnboardingDesdeRechazo(codigo, error);
  }
}

/** Resuelve el perfilId efectivo: el dado o el del perfil activo. */
async function idPerfil(perfilId?: string): Promise<string> {
  if (perfilId) return perfilId;
  const activo = await llamar<Perfil | null>('perfil_activo');
  if (!activo) {
    throw errorOnboardingDesdeRechazo(null, 'no hay un perfil activo');
  }
  return activo.id;
}

/** Adapter Tauri IPC del puerto de onboarding (inyectado en los casos de uso). */
class OnboardingAdapter implements OnboardingPort {
  async obtenerEstado(perfilId?: string): Promise<OnboardingStatus> {
    const id = await idPerfil(perfilId);
    return llamar<OnboardingStatus>('obtener_onboarding_status', { perfilId: id });
  }

  async actualizarDatos(datos: OnboardingData, perfilId?: string): Promise<void> {
    const id = await idPerfil(perfilId);
    await llamar<void>('actualizar_perfil_onboarding', { perfilId: id, datos });
  }

  async completarOnboarding(perfilId?: string): Promise<Perfil> {
    const id = await idPerfil(perfilId);
    return llamar<Perfil>('completar_onboarding', { perfilId: id });
  }

  async agregarMeta(perfilId: string | undefined, entrada: EntradaMeta): Promise<GoalEntry> {
    const id = await idPerfil(perfilId);
    return llamar<GoalEntry>('agregar_meta', {
      perfilId: id,
      titulo: entrada.titulo,
      descripcion: entrada.descripcion,
      tags: [...entrada.tags],
    });
  }

  async actualizarMeta(
    perfilId: string | undefined,
    metaId: string,
    entrada: EntradaMeta,
  ): Promise<GoalEntry> {
    const id = await idPerfil(perfilId);
    return llamar<GoalEntry>('actualizar_meta', {
      perfilId: id, metaId, titulo: entrada.titulo,
      descripcion: entrada.descripcion, tags: [...entrada.tags],
    });
  }

  async eliminarMeta(perfilId: string | undefined, metaId: string): Promise<void> {
    const id = await idPerfil(perfilId);
    await llamar<void>('eliminar_meta', { perfilId: id, metaId });
  }
}

/** Instancia única del puerto de onboarding para toda la app. */
export const onboardingPort: OnboardingPort = new OnboardingAdapter();
