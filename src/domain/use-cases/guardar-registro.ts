// REQ-06-04/06: caso de uso de guardado del mes: valida el borrador
// (mes e importes), construye el MonthlyRecord, lo inserta/actualiza en
// el snapshot y persiste por el puerto inyectado (adapter IPC).
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import type { MonthlyRecord } from '../entities/monthly-record.ts';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  INCOME_SOURCES,
  INCOME_SOURCE_LABELS,
} from '../entities/catalogs.ts';
import type { MonthKey } from '../entities/month-key.ts';
import { parseMonthKey } from '../entities/month-key.ts';
import { motivoDeRechazoIpc } from '../errors/snapshot-errors.ts';
import type { ErrorCampo } from './validacion-importes.ts';
import {
  parsearImporte,
  validarCamposImporte,
  type CampoImporte,
} from './validacion-importes.ts';
import type { SnapshotPort } from '../ports/snapshot-port.ts';
import { upsertRegistroMes } from './upsert-registro.ts';

/** Estado del formulario antes de confirmar: textos tal cual tecleados. */
export interface BorradorMes {
  readonly mes: string;
  readonly ingresos: Readonly<Record<string, string>>;
  readonly gastos: Readonly<Record<string, string>>;
}

export type ResultadoGuardado =
  | { readonly ok: true; readonly snapshot: FinanceSnapshot }
  | { readonly ok: false; readonly errores: readonly ErrorCampo[] };

/** Clave del aviso global cuando el fallo no pertenece a un campo. */
export const CLAVE_ERROR_GUARDADO = '__guardado__';

function camposDelBorrador(borrador: BorradorMes): CampoImporte[] {
  const ingresos = INCOME_SOURCES.map((clave) => ({
    clave: `ingreso:${clave}`,
    etiqueta: INCOME_SOURCE_LABELS[clave],
    texto: borrador.ingresos[clave] ?? '',
  }));
  const gastos = EXPENSE_CATEGORIES.map((clave) => ({
    clave: `gasto:${clave}`,
    etiqueta: EXPENSE_CATEGORY_LABELS[clave],
    texto: borrador.gastos[clave] ?? '',
  }));
  return [...ingresos, ...gastos];
}

function montos(
  claves: readonly string[],
  textos: Readonly<Record<string, string>>,
): Partial<Record<string, number>> {
  const pares: Array<[string, number]> = [];
  for (const clave of claves) {
    const valor = parsearImporte(textos[clave] ?? '');
    if (valor !== 0) pares.push([clave, valor]);
  }
  return Object.fromEntries(pares);
}

function construirRegistro(mes: MonthKey, borrador: BorradorMes): MonthlyRecord {
  return {
    mes,
    ingresos: montos(INCOME_SOURCES, borrador.ingresos),
    gastos: montos(EXPENSE_CATEGORIES, borrador.gastos),
  };
}

/**
 * Valida el borrador del mes y lo persiste: ante inválidos devuelve los
 * errores campo a campo sin llamar al puerto; si el backend rechaza,
 * traduce el motivo a un aviso global en español.
 */
export async function guardarRegistroMes(
  port: SnapshotPort,
  snapshot: FinanceSnapshot,
  borrador: BorradorMes,
): Promise<ResultadoGuardado> {
  let mes: MonthKey;
  try {
    mes = parseMonthKey(borrador.mes);
  } catch {
    return { ok: false, errores: [{ clave: 'mes', mensaje: 'Mes inválido: se espera el formato AAAA-MM.' }] };
  }
  const errores = validarCamposImporte(camposDelBorrador(borrador));
  if (errores.length > 0) return { ok: false, errores };
  const registro = construirRegistro(mes, borrador);
  const nuevo = upsertRegistroMes(snapshot, registro);
  try {
    await port.save(nuevo);
  } catch (error: unknown) {
    const motivo = motivoDeRechazoIpc(error);
    return { ok: false, errores: [{ clave: CLAVE_ERROR_GUARDADO, mensaje: `No se pudo guardar el registro: ${motivo}` }] };
  }
  return { ok: true, snapshot: nuevo };
}
