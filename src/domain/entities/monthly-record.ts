// Espejo de src-tauri/src/domain/monthly_record.rs. Los BTreeMap de Rust
// llegan como objetos parciales indexados por los valores de cable del
// catálogo (p. ej. { Salario: 2450 }); un mes puede omitir claves sin datos.
import type { ExpenseCategory, IncomeSource } from './catalogs.ts';
import type { MonthKey } from './month-key.ts';

/** Registro mensual de ingresos por fuente y gastos por categoría. */
export interface MonthlyRecord {
  readonly mes: MonthKey;
  readonly ingresos: Partial<Record<IncomeSource, number>>;
  readonly gastos: Partial<Record<ExpenseCategory, number>>;
}

function suma(valores: Array<number | undefined>): number {
  return valores.reduce<number>((total, valor) => total + (valor ?? 0), 0);
}

/** Suma de ingresos del mes (ausentes = 0), igual que `total_income`. */
export function totalIngresos(registro: MonthlyRecord): number {
  return suma(Object.values(registro.ingresos));
}

/** Suma de gastos del mes (ausentes = 0), igual que `total_expense`. */
export function totalGastos(registro: MonthlyRecord): number {
  return suma(Object.values(registro.gastos));
}
