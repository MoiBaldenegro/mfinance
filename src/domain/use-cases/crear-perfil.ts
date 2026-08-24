// REQ-22-04/05: alta de un perfil nuevo por nombre. La validación de
// vacío y duplicado ocurre ANTES de tocar el puerto: el mensaje en
// español sale junto al campo y no se crea nada. Los rechazos del
// backend (fuente de verdad) llegan igualmente como aviso en español.
import type { Perfil } from '../entities/perfil.ts';
import type { PerfilPort } from '../ports/perfil-port.ts';
import { motivoDeRechazoIpc } from '../errors/snapshot-errors.ts';

/** Mensaje del campo vacío, idéntico al texto nombrado del backend. */
export const AVISO_NOMBRE_VACIO = 'el nombre del perfil no puede estar vacío';

/** Mensaje de duplicado con el nombre entrecomillado como el backend. */
export function avisoNombreDuplicado(nombre: string): string {
  return `ya existe un perfil llamado «${nombre}»`;
}

export type ResultadoCreacionPerfil =
  | { readonly ok: true; readonly perfil: Perfil }
  | { readonly ok: false; readonly aviso: string };

/**
 * Valida el nombre (recortado) contra la lista existente y da de alta.
 * Con validación local fallida el puerto jamás se invoca (REQ-22-05).
 */
export async function crearPerfil(
  perfiles: PerfilPort,
  nombre: string,
  existentes: readonly Perfil[],
): Promise<ResultadoCreacionPerfil> {
  const limpio = nombre.trim();
  if (limpio.length === 0) {
    return { ok: false, aviso: AVISO_NOMBRE_VACIO };
  }
  if (existentes.some((perfil) => perfil.nombre === limpio)) {
    return { ok: false, aviso: avisoNombreDuplicado(limpio) };
  }
  try {
    return { ok: true, perfil: await perfiles.crear(limpio) };
  } catch (error: unknown) {
    return { ok: false, aviso: motivoDeRechazoIpc(error) };
  }
}
