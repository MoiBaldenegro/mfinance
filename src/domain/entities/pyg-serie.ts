// Espejo de src-tauri/src/application/pyg_serie.rs: SeriePyg calculada en
// backend y llegada por IPC con claves snake_case del cable serde.
import type { MonthKey } from './month-key.ts';

/** Fila P&G de un mes, tal como la serializa FilaPyg en Rust. */
export interface FilaPyg {
  readonly mes: MonthKey;
  readonly ingresos: number;
  readonly gastos: number;
  readonly utilidad: number;
  readonly ahorro_acumulado: number;
}

/** Serie mensual completa ordenada por mes ascendente. */
export interface SeriePyg {
  readonly filas: readonly FilaPyg[];
}
