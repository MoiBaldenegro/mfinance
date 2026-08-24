// REQ-22-01/06: carga del registro de perfiles para poblar la UI
// (cabecera y bloque Perfiles de Ajustes). Devuelve siempre un
// resultado explícito: lista más activo, o error nombrado en español.
import type { Perfil } from '../entities/perfil.ts';
import type { PerfilPort } from '../ports/perfil-port.ts';
import { errorPerfilDesdeRechazo } from '../errors/perfil-errors.ts';

export type EstadoPerfilesCargados =
  | {
    readonly ok: true;
    readonly perfiles: readonly Perfil[];
    readonly activo: Perfil | null;
  }
  | { readonly ok: false; readonly error: Error };

/**
 * Pide la lista y el activo al puerto inyectado y clasifica el
 * desenlace; un registro corrupto no rompe la app, produce el error.
 */
export async function cargarPerfiles(
  port: PerfilPort,
): Promise<EstadoPerfilesCargados> {
  try {
    const [perfiles, activo] = await Promise.all([
      port.listar(),
      port.activo(),
    ]);
    return { ok: true, perfiles, activo };
  } catch (error: unknown) {
    return { ok: false, error: errorPerfilDesdeRechazo(error) };
  }
}
