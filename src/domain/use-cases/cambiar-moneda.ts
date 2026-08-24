// REQ-20-01: cambio de moneda de visualización sobre el snapshot.
// Re-etiqueta la presentación; NO convierte importes (sin tasas externas).
// Devuelve un snapshot NUEVO (inmutabilidad) listo para persistir por el
// puerto existente (save_state) y publicar con aplicarSnapshot.
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import { CATALOGO_MONEDAS } from '../entities/moneda.ts';
import type { Moneda } from '../entities/moneda.ts';
import { MonedaFueraCatalogoError } from '../errors/moneda-errors.ts';

/** Nueva versión del snapshot con strategy.currency actualizada. */
export function cambiarMoneda(
  snapshot: FinanceSnapshot,
  moneda: Moneda,
): FinanceSnapshot {
  if (!CATALOGO_MONEDAS[moneda]) {
    throw new MonedaFueraCatalogoError(String(moneda));
  }
  return {
    ...snapshot,
    strategy: { ...snapshot.strategy, currency: moneda },
  };
}
