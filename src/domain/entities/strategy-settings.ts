// Espejo de src-tauri/src/domain/snapshot.rs (StrategySettings).
import type { DebtStrategy } from './catalogs.ts';
import type { Moneda } from './moneda.ts';

/** Ajustes de estrategia persistidos junto al resto del agregado. */
export interface StrategySettings {
  readonly debt_strategy: DebtStrategy;
  readonly extra_monthly_payment: number;
  /** REQ-19-01: moneda de visualización (re-etiqueta, no convierte). */
  readonly currency: Moneda;
}

/** Estrategia neutra por defecto, igual que `Default` en Rust (MXN). */
export const AJUSTES_POR_DEFECTO: StrategySettings = {
  debt_strategy: 'Avalanche',
  extra_monthly_payment: 0,
  currency: 'MXN',
};
