// REQ-03-07 espejo: un error nombrado por operación fallible del puerto
// SnapshotRepository, con el mensaje completo en español del backend.

/** Fallo al cargar el snapshot vigente. */
export class SnapshotLoadError extends Error {
  constructor(motivo: string) {
    super(`no se pudo cargar el snapshot: ${motivo}`);
    this.name = 'SnapshotLoadError';
  }
}

/** Fallo al guardar el snapshot vigente. */
export class SnapshotSaveError extends Error {
  constructor(motivo: string) {
    super(`no se pudo guardar el snapshot: ${motivo}`);
    this.name = 'SnapshotSaveError';
  }
}

/** Fallo al exportar una copia del snapshot. */
export class SnapshotExportError extends Error {
  constructor(motivo: string) {
    super(`no se pudo exportar el snapshot: ${motivo}`);
    this.name = 'SnapshotExportError';
  }
}

/** Fallo al importar un snapshot desde la copia externa. */
export class SnapshotImportError extends Error {
  constructor(motivo: string) {
    super(`no se pudo importar el snapshot: ${motivo}`);
    this.name = 'SnapshotImportError';
  }
}

/**
 * Extrae el motivo legible de un rechazo IPC: los commands devuelven
 * CommandError { codigo, mensaje } ya redactado en español; cualquier
 * otra cosa se describe por su mensaje o representación.
 */
export function motivoDeRechazoIpc(error: unknown): string {
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
const CODIGOS = {
  save: 'SnapshotSaveError',
  export: 'SnapshotExportError',
  import: 'SnapshotImportError',
} as const;

/**
 * Reconstruye el error nombrado TS correspondiente al codigo recibido;
 * lo desconocido se trata como fallo de carga (operación más común).
 */
export function errorDesdeCodigoIpc(codigo: unknown, motivo: string): Error {
  if (codigo === CODIGOS.save) return new SnapshotSaveError(motivo);
  if (codigo === CODIGOS.export) return new SnapshotExportError(motivo);
  if (codigo === CODIGOS.import) return new SnapshotImportError(motivo);
  return new SnapshotLoadError(motivo);
}

