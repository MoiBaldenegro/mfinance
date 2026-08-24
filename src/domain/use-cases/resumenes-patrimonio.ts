// Resúmenes de patrimonio (Balance Deuda Inversiones Conciliación Ajustes):
// cálculos puros en español sobre el snapshot, sin React ni IPC.
import { DEBT_STRATEGY_LABELS } from '../entities/catalogs.ts';
import {
  diferencia,
  estaConciliada,
} from '../entities/account-statement.ts';
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import { formatoMoneda } from './formato-moneda.ts';
import { monedaDeSnapshot } from './moneda-snapshot.ts';

export function resumenBalance(snapshot: FinanceSnapshot): string {
  const moneda = monedaDeSnapshot(snapshot);
  const activos = snapshot.assets.reduce(
    (total, activo) => total + activo.valor_actual, 0,
  );
  const pasivos = snapshot.liabilities.reduce(
    (total, pasivo) => total + pasivo.saldo_pendiente, 0,
  );
  return (
    `Patrimonio actual: ${formatoMoneda(activos, moneda)} en activos menos ` +
    `${formatoMoneda(pasivos, moneda)} en pasivos igual a ` +
    `${formatoMoneda(activos - pasivos, moneda)}.`
  );
}

export function resumenDeuda(snapshot: FinanceSnapshot): string {
  const moneda = monedaDeSnapshot(snapshot);
  const deuda = snapshot.liabilities.reduce(
    (total, pasivo) => total + pasivo.saldo_pendiente, 0,
  );
  const estrategia = DEBT_STRATEGY_LABELS[snapshot.strategy.debt_strategy];
  return (
    `Deuda pendiente total: ${formatoMoneda(deuda, moneda)}. ` +
    `Estrategia de ataque: ${estrategia}.`
  );
}

export function resumenInversiones(snapshot: FinanceSnapshot): string {
  const moneda = monedaDeSnapshot(snapshot);
  const valor = snapshot.investments.reduce(
    (total, inversion) => total + inversion.valor_actual, 0,
  );
  const aportes = snapshot.investments.reduce(
    (total, inversion) => total + inversion.aporte_mensual, 0,
  );
  return (
    `${snapshot.investments.length} inversiones por ${formatoMoneda(valor, moneda)}; ` +
    `aportaciones mensuales de ${formatoMoneda(aportes, moneda)}.`
  );
}

export function resumenConciliacion(snapshot: FinanceSnapshot): string {
  const moneda = monedaDeSnapshot(snapshot);
  const estados = snapshot.account_statements;
  const cuadran = estados.filter((estado) => estaConciliada(estado)).length;
  const descuadre = estados.reduce<number>(
    (total, estado) => total + Math.abs(diferencia(estado)), 0,
  );
  const cola = descuadre > 0
    ? ` Descuadre pendiente: ${formatoMoneda(descuadre, moneda)}.`
    : '';
  return `${cuadran} de ${estados.length} cuentas conciliadas.${cola}`;
}

export function resumenAjustes(snapshot: FinanceSnapshot): string {
  const moneda = monedaDeSnapshot(snapshot);
  const estrategia = DEBT_STRATEGY_LABELS[snapshot.strategy.debt_strategy];
  const extra = formatoMoneda(snapshot.strategy.extra_monthly_payment, moneda);
  return `Estrategia ${estrategia} con ${extra} extra al mes.`;
}
