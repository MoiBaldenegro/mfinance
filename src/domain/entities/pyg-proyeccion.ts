// Espejo de src-tauri/src/application/pyg_proyeccion.rs: ProyeccionPyg y BalanceFuturo
// calculados en backend y llegados por IPC con claves snake_case del cable serde.

/** Fila de proyección PyG (histórica o proyectada), tal como la serializa FilaProyeccionPyg en Rust. */
export interface FilaProyeccionPyg {
  readonly mes: string;
  readonly ingresos: number;
  readonly gastos: number;
  readonly utilidad: number;
  readonly ahorro_acumulado: number;
}

/** Proyección PyG completa: histórico real + 12 meses proyectados. */
export interface ProyeccionPyg {
  readonly filas_historicas: readonly FilaProyeccionPyg[];
  readonly filas_proyectadas: readonly FilaProyeccionPyg[];
}

/** Fila de balance futuro (histórica o proyectada). */
export interface FilaBalanceFuturo {
  readonly mes: string;
  readonly activos: number;
  readonly pasivos: number;
  readonly patrimonio: number;
}

/** Balance futuro completo: histórico real + 12 meses proyectados. */
export interface BalanceFuturo {
  readonly filas_historicas: readonly FilaBalanceFuturo[];
  readonly filas_proyectadas: readonly FilaBalanceFuturo[];
}

/** Supuestos de proyección: variación % mensual por fuente de ingreso y categoría de gasto.
 *  Lenguaje de la app (camelCase); el adapter IPC lo traduce al cable serde
 *  snake_case del backend (claves canónicas igual que IncomeSource::as_str). */
export interface SupuestosProyeccion {
  readonly variacionIngresos: Record<string, number>;
  readonly variacionGastos: Record<string, number>;
}

/** Supuestos por defecto (continuación plana: 0% variación). */
export const SUPUESTOS_DEFECTO: SupuestosProyeccion = {
  variacionIngresos: {},
  variacionGastos: {},
};