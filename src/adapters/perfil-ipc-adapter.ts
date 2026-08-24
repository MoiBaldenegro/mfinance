// REQ-22-01: adapter Tauri IPC del puerto PerfilPort. Junto a
// snapshot-ipc-adapter es el ÚNICO módulo del frontend que invoca
// invoke(): expone listar_perfiles perfil_activo crear_perfil y
// seleccionar_perfil reconstruyendo sus errores nombrados en español.
import { invoke } from '@tauri-apps/api/core';
import type { Perfil } from '../domain/entities/perfil.ts';
import type { PerfilPort } from '../domain/ports/perfil-port.ts';
import { errorPerfilDesdeRechazo } from '../domain/errors/perfil-errors.ts';

/** Llama a un command y convierte cualquier rechazo en error nombrado. */
async function llamar<T>(
  comando: string,
  argumentos?: Record<string, unknown>,
): Promise<T> {
  try {
    return await invoke<T>(comando, argumentos);
  } catch (error: unknown) {
    throw errorPerfilDesdeRechazo(error);
  }
}

/** Adapter Tauri IPC del puerto de perfiles (inyectado en los casos de uso). */
class PerfilIpcAdapter implements PerfilPort {
  listar(): Promise<Perfil[]> {
    return llamar<Perfil[]>('listar_perfiles');
  }

  activo(): Promise<Perfil | null> {
    return llamar<Perfil | null>('perfil_activo');
  }

  crear(nombre: string): Promise<Perfil> {
    return llamar<Perfil>('crear_perfil', { nombre });
  }

  seleccionar(id: string): Promise<Perfil> {
    return llamar<Perfil>('seleccionar_perfil', { id });
  }
}

/** Instancia única del puerto de perfiles para toda la app. */
export const perfilPort: PerfilPort = new PerfilIpcAdapter();
