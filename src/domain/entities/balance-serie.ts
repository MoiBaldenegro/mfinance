// Espejo de src-tauri/src/application/balance_serie.rs: balance completo
// calculado en backend y llegado por IPC con claves snake_case del cable serde.
import type { MonthKey } from './month-key.ts';

/** Totales del balance: suma de activos, suma de pasivos y patrimonio. */
export interface TotalesBalance {
  readonly activos: number;
  readonly pasivos: number;
  readonly patrimonio: number;
}

/** Fila de la serie mensual de balance: mes y totales de ese mes. */
export interface FilaBalance {
  readonly mes: MonthKey;
  readonly activos: number;
  readonly pasivos: number;
  readonly patrimonio: number;
}

/** Serie mensual completa de evolución del balance ordenada por mes ascendente. */
export interface SerieBalance {
  readonly filas: readonly FilaBalance[];
}

/** Balance completo: totales actuales + serie mensual histórica. */
export interface BalanceCompleto {
  readonly totales: TotalesBalance;
  readonly serie: SerieBalance;
}