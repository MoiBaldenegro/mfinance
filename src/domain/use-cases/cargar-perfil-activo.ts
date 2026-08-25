import type { PerfilActivoConOnboarding } from '../entities/onboarding/index.ts';
import { motivoDeRechazoIpc, SnapshotLoadError } from '../errors/snapshot-errors.ts';
import type { SnapshotPort } from '../ports/snapshot-port.ts';

export type ResultadoPerfilActivo =
  | { readonly ok: true; readonly datos: PerfilActivoConOnboarding }
  | { readonly ok: false; readonly error: SnapshotLoadError };

export interface CargaAislada {
  readonly generacion: number;
  readonly resultado: ResultadoPerfilActivo;
}

/** Obtiene el snapshot del activo y normaliza el fallo sin publicar datos. */
export async function cargarPerfilActivo(
  port: Pick<SnapshotPort, 'obtenerPerfilActivoConOnboarding'>,
): Promise<ResultadoPerfilActivo> {
  try {
    return { ok: true, datos: await port.obtenerPerfilActivoConOnboarding() };
  } catch (error: unknown) {
    return { ok: false, error: new SnapshotLoadError(motivoDeRechazoIpc(error)) };
  }
}
