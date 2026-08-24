// Espejo de src-tauri/src/domain/snapshot.rs (FinanceSnapshot): raíz del
// agregado financiero tal cual llega serializada por los commands IPC.
import type { AccountStatement } from './account-statement.ts';
import type { Asset } from './asset.ts';
import type { AssessmentRegistro } from './cierre.ts';
import type { Investment } from './investment.ts';
import type { Liability } from './liability.ts';
import type { MonthlyRecord } from './monthly-record.ts';
import { AJUSTES_POR_DEFECTO } from './strategy-settings.ts';
import type { StrategySettings } from './strategy-settings.ts';

/** Todo el estado del usuario agrupado en un único snapshot. */
export interface FinanceSnapshot {
  readonly monthly_records: readonly MonthlyRecord[];
  readonly assets: readonly Asset[];
  readonly liabilities: readonly Liability[];
  readonly investments: readonly Investment[];
  readonly account_statements: readonly AccountStatement[];
  readonly strategy: StrategySettings;
  /** Assessments de los meses cerrados (REQ-16-08). */
  readonly assessments: readonly AssessmentRegistro[];
}

/** Snapshot vacío con estrategia neutra, igual que `FinanceSnapshot::new`. */
export const SNAPSHOT_VACIO: FinanceSnapshot = {
  monthly_records: [],
  assets: [],
  liabilities: [],
  investments: [],
  account_statements: [],
  strategy: AJUSTES_POR_DEFECTO,
  assessments: [],
};
