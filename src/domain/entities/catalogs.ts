// Catálogos espejo de src-tauri/src/domain/catalogs.rs (REQ-05-01).
//
// HALLAZGO SERDE (verificado empíricamente con cargo en el ciclo F5): los
// enums unit serializan con el NOMBRE de la variante Rust tal cual
// ("Salario", "CuotasDeuda", "Avalanche"), no con la clave canónica
// minúscula de `as_str()`. Las uniones TS usan esos valores de cable;
// las claves canónicas del backend quedan expuestas como catálogo derivado.

export const INCOME_SOURCES = ['Salario', 'Freelance', 'Arriendos', 'Otros'] as const;

/** Fuente de ingreso mensual (valor tal cual llega por IPC). */
export type IncomeSource = typeof INCOME_SOURCES[number];

/** Claves canónicas del backend (`IncomeSource::as_str`), mismo orden. */
export const CANONICAL_INCOME_KEYS = [
  'salario',
  'freelance',
  'arriendos',
  'otros',
] as const;

export const INCOME_SOURCE_LABELS: Record<IncomeSource, string> = {
  Salario: 'Salario',
  Freelance: 'Freelance',
  Arriendos: 'Arriendos',
  Otros: 'Otros',
};

export const EXPENSE_CATEGORIES = [
  'Vivienda',
  'Alimentacion',
  'Transporte',
  'CuotasDeuda',
  'Ocio',
  'Otros',
] as const;

/** Categoría de gasto mensual (valor tal cual llega por IPC). */
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

/** Claves canónicas del backend (`ExpenseCategory::as_str`), mismo orden. */
export const CANONICAL_EXPENSE_KEYS = [
  'vivienda',
  'alimentacion',
  'transporte',
  'cuotas_deuda',
  'ocio',
  'otros',
] as const;

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  Vivienda: 'Vivienda',
  Alimentacion: 'Alimentación',
  Transporte: 'Transporte',
  CuotasDeuda: 'Cuotas de deuda',
  Ocio: 'Ocio',
  Otros: 'Otros',
};

export const INVESTMENT_FAMILIES = ['RentaFija', 'RentaVariable', 'FincaRaiz'] as const;

/** Familia de inversión (valor tal cual llega por IPC). */
export type InvestmentFamily = typeof INVESTMENT_FAMILIES[number];

export const INVESTMENT_FAMILY_LABELS: Record<InvestmentFamily, string> = {
  RentaFija: 'Renta fija',
  RentaVariable: 'Renta variable',
  FincaRaiz: 'Finca raíz',
};

export const DEBT_STRATEGIES = ['Avalanche', 'Snowball'] as const;

/** Estrategia de ataque a la deuda (valor tal cual llega por IPC). */
export type DebtStrategy = typeof DEBT_STRATEGIES[number];

export const DEBT_STRATEGY_LABELS: Record<DebtStrategy, string> = {
  Avalanche: 'Avalancha',
  Snowball: 'Bola de nieve',
};
