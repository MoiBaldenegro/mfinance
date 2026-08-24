// Espejo de src-tauri/src/application/conciliacion.rs: tipos de
// conciliación que llegan por IPC con claves snake_case del cable serde.

import type { Movement } from './account-statement.ts';

/** Cuenta con su estado de conciliación calculado. */
export interface CuentaConciliada {
  readonly cuenta: string;
  readonly saldo_inicial: number;
  readonly movimientos: readonly Movement[];
  readonly saldo_final: number;
  readonly saldo_teorico: number;
  readonly diferencia: number;
  readonly conciliada: boolean;
}

/** Resultado de la conciliación de un mes. */
export interface ConciliacionMensual {
  readonly mes: string;
  readonly cuentas: readonly CuentaConciliada[];
  readonly todas_conciliadas: boolean;
}

/** Histórico de conciliación por mes. */
export interface HistoricoConciliacion {
  readonly meses: readonly string[];
  readonly por_mes_data: Record<string, ConciliacionMensual>;
}