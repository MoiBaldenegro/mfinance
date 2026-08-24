// Espejo de src-tauri/src/application/indicadores.rs (Indicadores):
// resultado del command indicadores con los cuatro indicadores del semáforo.

/** Clasificación del semáforo (tal cual llega por IPC desde Rust). */
export type SemaphoreType = 'verde' | 'amarillo' | 'rojo';

/** Resultado de un indicador individual. */
export interface IndicadorResultado {
  readonly nombre: string;
  readonly valor: number;
  readonly clasificacion: SemaphoreType;
  readonly sin_datos: boolean;
  readonly explicacion: string | null;
}

/** Conjunto de los cuatro indicadores del semáforo. */
export interface Indicadores {
  readonly endeudamiento: IndicadorResultado;
  readonly tasa_ahorro: IndicadorResultado;
  readonly fondo_emergencia: IndicadorResultado;
  readonly ingreso_pasivo: IndicadorResultado;
}