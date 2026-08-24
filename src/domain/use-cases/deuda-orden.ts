// REQ-09-01/04: lógica pura de ordenación de deudas según estrategia
// (avalancha = tasa descendente, bola de nieve = saldo ascendente).
import type { DeudaPlan } from '../entities/plan-deuda.ts';
import type { DebtStrategy } from '../entities/catalogs.ts';

/** Ordena las deudas por avalancha: tasa de interés descendente. */
export function ordenAvalancha(deudas: readonly DeudaPlan[]): DeudaPlan[] {
  return [...deudas].sort((a, b) => b.tasa_interes_anual - a.tasa_interes_anual);
}

/** Ordena las deudas por bola de nieve: saldo pendiente ascendente. */
export function ordenBolaNieve(deudas: readonly DeudaPlan[]): DeudaPlan[] {
  return [...deudas].sort((a, b) => a.saldo_pendiente - b.saldo_pendiente);
}

/** Devuelve las deudas ordenadas según la estrategia elegida. */
export function deudasSegunEstrategia(
  deudas: readonly DeudaPlan[],
  estrategia: DebtStrategy,
): DeudaPlan[] {
  return estrategia === 'Avalanche' ? ordenAvalancha(deudas) : ordenBolaNieve(deudas);
}

/** Devuelve la deuda objetivo (primera en el orden de la estrategia). */
export function deudaObjetivo(
  deudas: readonly DeudaPlan[],
  estrategia: DebtStrategy,
): DeudaPlan | null {
  const ordenadas = deudasSegunEstrategia(deudas, estrategia);
  return ordenadas[0] ?? null;
}