// REQ-06-04/08: alta o actualización del registro mensual dentro del
// snapshot (crear si falta el mes, actualizar si existe) y consulta
// del registro de un mes concreto. Entidades inmutables: se devuelve
// un snapshot nuevo, jamás una mutación en sitio.
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import { ImporteNegativoError } from '../errors/importe-errors.ts';
import type { MonthlyRecord } from '../entities/monthly-record.ts';
import { parseMonthKey } from '../entities/month-key.ts';

/** Registro del mes pedido si existe; undefined abre a ceros (REQ-06-08). */
export function buscarRegistroMes(
  snapshot: FinanceSnapshot,
  mes: string,
): MonthlyRecord | undefined {
  return snapshot.monthly_records.find((registro) => registro.mes === mes);
}

function asegurarImportesValidos(registro: MonthlyRecord): void {
  const valores = [
    ...Object.values(registro.ingresos),
    ...Object.values(registro.gastos),
  ];
  for (const valor of valores) {
    if (!Number.isFinite(valor) || valor < 0) {
      throw new ImporteNegativoError(String(valor));
    }
  }
}

/**
 * Sustituye el registro del mismo mes o añade el nuevo, dejando la
 * serie ordenada por mes ascendente. Valida mes e importes con los
 * errores nombrados del dominio antes de tocar nada.
 */
export function upsertRegistroMes(
  snapshot: FinanceSnapshot,
  registro: MonthlyRecord,
): FinanceSnapshot {
  parseMonthKey(registro.mes);
  asegurarImportesValidos(registro);
  const otros = snapshot.monthly_records.filter(
    (existente) => existente.mes !== registro.mes,
  );
  const serie = [...otros, registro].sort((a, b) => a.mes.localeCompare(b.mes));
  return { ...snapshot, monthly_records: serie };
}
