// REQ-22-01/06: espejo de los errores nombrados de
// src-tauri/src/domain/perfil_errors.rs. Cada fallo del puerto de
// perfiles se reconstruye con su nombre estable y el mensaje en español
// que envía el backend (CommandError.mensaje); nunca fallos silenciosos.
import { motivoDeRechazoIpc } from './snapshot-errors.ts';

/** El nombre solicitado está vacío o solo con espacios. */
export class PerfilNombreVacioError extends Error {
  constructor(motivo: string) {
    super(motivo);
    this.name = 'PerfilNombreVacioError';
  }
}

/** Ya existe otro perfil con el mismo nombre. */
export class PerfilNombreDuplicadoError extends Error {
  constructor(motivo: string) {
    super(motivo);
    this.name = 'PerfilNombreDuplicadoError';
  }
}

/** profiles.json existe pero no es un registro válido. */
export class PerfilRegistroCorruptoError extends Error {
  constructor(motivo: string) {
    super(motivo);
    this.name = 'PerfilRegistroCorruptoError';
  }
}

/** El id indicado no corresponde a ningún perfil conocido. */
export class PerfilInexistenteError extends Error {
  constructor(motivo: string) {
    super(motivo);
    this.name = 'PerfilInexistenteError';
  }
}

/** Fallo técnico al persistir o leer el registro (y código desconocido). */
export class PerfilPersistenciaError extends Error {
  constructor(motivo: string) {
    super(motivo);
    this.name = 'PerfilPersistenciaError';
  }
}

/** Fallo al restaurar el perfil y la vista previos. */
export class RollbackPerfilError extends Error {
  readonly fase: 'rollback-seleccion' | 'rollback-carga';

  constructor(fase: 'rollback-seleccion' | 'rollback-carga', motivo: string) {
    super(`${fase}: ${motivo}`);
    this.name = 'RollbackPerfilError';
    this.fase = fase;
  }
}

/** Reconstruye la clase nombrada según CommandError.codigo del backend. */
export function errorPerfilDesdeCodigoIpc(
  codigo: unknown,
  motivo: string,
): Error {
  if (codigo === 'PerfilNombreVacioError') {
    return new PerfilNombreVacioError(motivo);
  }
  if (codigo === 'PerfilNombreDuplicadoError') {
    return new PerfilNombreDuplicadoError(motivo);
  }
  if (codigo === 'PerfilRegistroCorruptoError') {
    return new PerfilRegistroCorruptoError(motivo);
  }
  if (codigo === 'PerfilInexistenteError') {
    return new PerfilInexistenteError(motivo);
  }
  return new PerfilPersistenciaError(motivo);
}

/**
 * Normaliza cualquier rechazo del puerto a un error nombrado de
 * perfiles: los ya reconstruidos pasan tal cual; un objeto IPC crudo
 * ({ codigo, mensaje }) se mapea por su codigo; lo demás cae en
 * PerfilPersistenciaError conservando el motivo legible.
 */
export function errorPerfilDesdeRechazo(error: unknown): Error {
  if (error instanceof Error && error.name.startsWith('Perfil')) {
    return error;
  }
  const codigo = typeof error === 'object' && error !== null
    ? (error as { codigo?: unknown }).codigo
    : undefined;
  return errorPerfilDesdeCodigoIpc(codigo, motivoDeRechazoIpc(error));
}
