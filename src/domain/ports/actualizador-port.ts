// Puerto del núcleo frontend para las actualizaciones de la aplicación.
// Lo define el dominio (puro, sin Tauri) y lo implementa un adapter; la UI
// solo consume la interfaz inyectada por el composition root.
export interface ActualizacionDisponible {
  readonly version: string;
  readonly notas: string | null;
  readonly fecha: string | null;
}

export interface ProgresoActualizacion {
  readonly descargado: number;
  readonly total: number | null;
}

export interface ActualizadorPort {
  /** Versión de la app que se está ejecutando. */
  versionActual(): Promise<string>;
  /** Consulta el endpoint configurado; null si no hay versión nueva. */
  buscar(): Promise<ActualizacionDisponible | null>;
  /** Descarga e instala la actualización pendiente. */
  descargarEInstalar(
    alProgreso: (progreso: ProgresoActualizacion) => void,
  ): Promise<void>;
  /** Reinicia la app para terminar de aplicar la actualización. */
  reiniciar(): Promise<void>;
}
