// REQ-22-02/03: caso de uso de cambio de perfil. Activa el perfil en el
// backend, fija el titular visible de la cabecera y dispara la recarga
// del snapshot por el flujo existente para que TODAS las secciones
// refresquen con los datos del titular elegido (REQ-22-07: la moneda es
// la del snapshot nuevo sin lógica adicional).
import type { Perfil } from '../entities/perfil.ts';
import type { PerfilPort } from '../ports/perfil-port.ts';
import { errorPerfilDesdeRechazo } from '../errors/perfil-errors.ts';

/** Puertos y acciones que orquesta el cambio, inyectados por la UI. */
export interface PuertosCambioPerfil {
  readonly perfiles: PerfilPort;
  /** Publica al titular activado (indicador permanente REQ-22-02). */
  readonly alConfirmar: (perfil: Perfil) => void;
  /** Relanza la carga del snapshot (flujo existente, REQ-22-03). */
  readonly alRecargar: () => void;
}

export type ResultadoCambioPerfil =
  | { readonly ok: true; readonly perfil: Perfil }
  | { readonly ok: false; readonly error: Error };

/**
 * Activa el perfil indicado. Si la selección falla NO toca la UI:
 * ni titular ni recarga (sin mezclar datos entre perfiles, REQ-22-06).
 */
export async function cambiarPerfil(
  puertos: PuertosCambioPerfil,
  id: string,
): Promise<ResultadoCambioPerfil> {
  let activado: Perfil;
  try {
    activado = await puertos.perfiles.seleccionar(id);
  } catch (error: unknown) {
    return { ok: false, error: errorPerfilDesdeRechazo(error) };
  }
  puertos.alConfirmar(activado);
  puertos.alRecargar();
  return { ok: true, perfil: activado };
}
