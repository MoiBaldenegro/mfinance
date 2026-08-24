// Espejo de src-tauri/src/application/inversiones_proyeccion.rs: proyección
// de valor futuro a 5/10/20 años por familia de inversión.
export type InvestmentFamily = 'renta_fija' | 'renta_variable' | 'finca_raiz';

/** Proyección de una familia de inversión. */
export interface ProyeccionFamilia {
  readonly familia: InvestmentFamily;
  readonly valor_futuro_5: number;
  readonly valor_futuro_10: number;
  readonly valor_futuro_20: number;
}

/** Proyección completa de todas las inversiones. */
export interface ProyeccionInversiones {
  readonly familias: readonly ProyeccionFamilia[];
  readonly total_aportes_mensuales: number;
}