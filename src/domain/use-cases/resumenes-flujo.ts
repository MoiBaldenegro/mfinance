// Resúmenes de flujo de caja (Registro PyG Indicadores Cierre Diagnóstico):
// cálculos puros en español sobre el snapshot, sin React ni IPC.
// REQ-20-03: el formateo sale del núcleo multi-moneda (formatoMoneda)
// con la moneda derivada del snapshot (monedaDeSnapshot, defecto MXN).
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import type { MonthlyRecord } from '../entities/monthly-record.ts';
import { totalGastos, totalIngresos } from '../entities/monthly-record.ts';
import { formatoMoneda } from './formato-moneda.ts';
import { monedaDeSnapshot } from './moneda-snapshot.ts';

/** Último registro mensual del snapshot, si existe. */
export function ultimoRegistro(
  snapshot: FinanceSnapshot,
): MonthlyRecord | undefined {
  return snapshot.monthly_records[snapshot.monthly_records.length - 1];
}

/** Mes de trabajo actual: mes del último registro; null sin registros. */
export function mesDeTrabajo(snapshot: FinanceSnapshot): string | null {
  const ultimo = ultimoRegistro(snapshot);
  return ultimo ? ultimo.mes : null;
}

export function resumenRegistro(snapshot: FinanceSnapshot): string {
  const total = snapshot.monthly_records.length;
  const ultimo = ultimoRegistro(snapshot);
  const cola = ultimo
    ? `Último mes registrado: ${ultimo.mes}.`
    : 'Aún no hay meses registrados.';
  return `${total} registros mensuales. ${cola}`;
}

export function resumenPyg(snapshot: FinanceSnapshot): string {
  const ultimo = ultimoRegistro(snapshot);
  if (!ultimo) return 'Sin datos aún: registra tu primer mes en Registro.';
  const utilidad = totalIngresos(ultimo) - totalGastos(ultimo);
  const importe = formatoMoneda(utilidad, monedaDeSnapshot(snapshot));
  return (
    `Utilidad de ${ultimo.mes}: ingresos menos gastos igual a ` +
    `${importe}.`
  );
}

export function resumenIndicadores(snapshot: FinanceSnapshot): string {
  const ultimo = ultimoRegistro(snapshot);
  if (!ultimo) return 'Sin datos aún para calcular indicadores.';
  const ingresos = totalIngresos(ultimo);
  const tasa = ingresos > 0
    ? ((ingresos - totalGastos(ultimo)) / ingresos) * 100
    : 0;
  const texto = tasa.toFixed(1).replace('.', ',');
  return `Tasa de ahorro del último mes: ${texto} %.`;
}

export function resumenCierre(snapshot: FinanceSnapshot): string {
  const ultimo = ultimoRegistro(snapshot);
  return ultimo
    ? `Último cierre disponible: ${ultimo.mes}.`
    : 'Todavía no hay ningún mes cerrado.';
}

export function resumenDiagnostico(snapshot: FinanceSnapshot): string {
  const meses = snapshot.monthly_records.length;
  return `${meses} meses con datos listos para diagnóstico.`;
}
