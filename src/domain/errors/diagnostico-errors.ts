// Errores nombrados del diagnóstico en el frontend: conservan el código
// del backend (MesInvalidoError, ComprobantesAlmacenError, SnapshotError…)
// para que la UI muestre mensajes en español sin perder trazabilidad.

/** Error tipado del adapter IPC del diagnóstico. */
export class DiagnosticoIpcError extends Error {
  /** Nombre del error de aplicación devuelto por el command. */
  readonly codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'DiagnosticoIpcError';
    this.codigo = codigo;
  }
}
