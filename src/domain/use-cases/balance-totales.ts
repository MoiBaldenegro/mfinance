// REQ-08-03/04: totales puros del balance (activos, pasivos, patrimonio)
// sobre el snapshot, sin React ni IPC.
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import type { TotalesBalance } from '../entities/balance-serie.ts';

/** Calcula totales de activos, pasivos y patrimonio desde el snapshot. */
export function calcularTotalesBalance(
  snapshot: FinanceSnapshot,
): TotalesBalance {
  const activos = snapshot.assets.reduce(
    (total, activo) => total + activo.valor_actual,
    0,
  );
  const pasivos = snapshot.liabilities.reduce(
    (total, pasivo) => total + pasivo.saldo_pendiente,
    0,
  );
  return { activos, pasivos, patrimonio: activos - pasivos };
}