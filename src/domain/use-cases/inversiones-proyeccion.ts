// Lógica pura para inversiones-proyeccion (REQ-11-02/05/06/07):
// cálculo VF, validación tasa, formateo sin decimales vía el núcleo
// multi-moneda (REQ-20-03), suma aportes.

import type { InvestmentFamily } from '../entities/catalogs.ts';
import type { Moneda } from '../entities/moneda.ts';
import { formatoMoneda } from './formato-moneda.ts';

/** Calcula el valor futuro con capitalización mensual.
 * VF = PV * (1 + r_m)^n + PMT * ((1 + r_m)^n - 1) / r_m
 * donde r_m = tasa_anual / 100 / 12, n = años * 12.
 * Si tasa = 0: VF = PV + PMT * n. */
export function calcularVF(
  valorActual: number,
  aporteMensual: number,
  tasaAnualPct: number,
  anos: number,
): number {
  const meses = anos * 12;
  if (tasaAnualPct === 0) {
    return valorActual + aporteMensual * meses;
  }
  const r_m = tasaAnualPct / 100 / 12;
  const factor = (1 + r_m) ** meses;
  return valorActual * factor + aporteMensual * (factor - 1) / r_m;
}

/** Valida que la tasa esté en [0, 30] (REQ-11-05). */
export function validarTasa(tasa: number): { valida: boolean; mensaje: string } {
  if (tasa < 0) {
    return { valida: false, mensaje: 'La tasa no puede ser negativa' };
  }
  if (tasa > 30) {
    return { valida: false, mensaje: 'La tasa no puede superar el 30% anual' };
  }
  return { valida: true, mensaje: '' };
}

/** Formatea un valor proyectado sin decimales (REQ-11-07, REQ-20-03). */
export function formatearProyeccion(valor: number, moneda: Moneda): string {
  return formatoMoneda(Math.round(valor), moneda, 0);
}

/** Suma los aportes mensuales de todas las familias (REQ-11-06). */
export function sumarAportes(
  familias: ReadonlyArray<{ readonly familia: InvestmentFamily; readonly aporte_mensual: number }>,
): number {
  return familias.reduce((sum, f) => sum + f.aporte_mensual, 0);
}

/** Valida aporte mensual y valor actual de una inversión (REQ-25-05).
 * Aporte y valor no pueden ser negativos. */
export function validarInversion(aporteMensual: number, valorActual: number): string | undefined {
  if (aporteMensual < 0) return 'El aporte mensual no puede ser negativo';
  if (valorActual < 0) return 'El valor actual no puede ser negativo';
  return undefined;
}