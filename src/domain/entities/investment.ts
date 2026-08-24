// Espejo de src-tauri/src/domain/investment.rs: inversión por familia.
import type { InvestmentFamily } from './catalogs.ts';

/** Inversión con aporte mensual, valor actual y tasa esperada editable. */
export interface Investment {
  readonly familia: InvestmentFamily;
  readonly aporte_mensual: number;
  readonly valor_actual: number;
  readonly tasa_esperada_anual: number;
}
