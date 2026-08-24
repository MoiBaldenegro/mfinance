// REQ-20-03/06: guardia de la moneda activa del snapshot cargado.
// Los resúmenes y el shell la derivan de AQUÍ: si el snapshot procede de
// una versión antigua sin campo currency (o trae un valor fuera del
// catálogo), se aplica el defecto del modelo MXN sin errores.
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import { MONEDAS } from '../entities/moneda.ts';
import type { Moneda } from '../entities/moneda.ts';

/** Moneda de visualización del snapshot, con defecto MXN garantizado. */
export function monedaDeSnapshot(
  snapshot: FinanceSnapshot | undefined | null,
): Moneda {
  const candidata = snapshot?.strategy?.currency;
  return candidata !== undefined &&
    candidata !== null &&
    MONEDAS.includes(candidata)
    ? candidata
    : 'MXN';
}
