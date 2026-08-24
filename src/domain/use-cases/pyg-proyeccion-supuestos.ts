// REQ-14-03/06: lógica pura para el formulario de supuestos de proyección.
// Claves canónicas (minúsculas sin tildes) igual que el backend; la
// traducción al cable serde snake_case vive en el adapter IPC.
import type { SupuestosProyeccion } from '../entities/pyg-proyeccion.ts';
import { CANONICAL_INCOME_KEYS, CANONICAL_EXPENSE_KEYS } from '../entities/catalogs.ts';

/** Supuestos por defecto: continuación plana (0% variación en todo). */
export function supuestosPorDefecto(): SupuestosProyeccion {
  return { variacionIngresos: {}, variacionGastos: {} };
}

/** Aplica una variación a un supuesto (ingreso o gasto). Devuelve nuevos supuestos inmutables. */
export function aplicarSupuestos(
  supuestos: SupuestosProyeccion,
  tipo: 'ingreso' | 'gasto',
  clave: string,
  variacion: number,
): SupuestosProyeccion {
  const nuevos = {
    variacionIngresos: { ...supuestos.variacionIngresos },
    variacionGastos: { ...supuestos.variacionGastos },
  };
  if (tipo === 'ingreso') {
    nuevos.variacionIngresos[clave] = variacion;
  } else {
    nuevos.variacionGastos[clave] = variacion;
  }
  return nuevos;
}

/** Claves canónicas de fuentes de ingreso para el formulario. */
export function clavesIngresos(): readonly string[] {
  return CANONICAL_INCOME_KEYS;
}

/** Claves canónicas de categorías de gasto para el formulario. */
export function clavesGastos(): readonly string[] {
  return CANONICAL_EXPENSE_KEYS;
}

/** Etiqueta legible para una clave de ingreso. */
export function etiquetaIngreso(clave: string): string {
  const etiquetas: Record<string, string> = {
    salario: 'Salario',
    freelance: 'Freelance',
    arriendos: 'Arriendos',
    otros: 'Otros',
  };
  return etiquetas[clave] ?? clave;
}

/** Etiqueta legible para una clave de gasto. */
export function etiquetaGasto(clave: string): string {
  const etiquetas: Record<string, string> = {
    vivienda: 'Vivienda',
    alimentacion: 'Alimentación',
    transporte: 'Transporte',
    cuotas_deuda: 'Cuotas de deuda',
    ocio: 'Ocio',
    otros: 'Otros',
  };
  return etiquetas[clave] ?? clave;
}

/** Formatea una variación como porcentaje para mostrar en UI. */
export function formatearVariacion(v: number): string {
  const signo = v >= 0 ? '+' : '';
  return `${signo}${(v * 100).toFixed(1)}%`;
}

/** Parsea un string de porcentaje (ej: "+2.5%", "-1%", "0") a número (ej: 0.025, -0.01, 0). */
export function parsearVariacion(s: string): number {
  const limpio = s.trim().replace('%', '').replace('+', '');
  if (!limpio) return 0;
  const n = Number(limpio);
  if (Number.isNaN(n)) return 0;
  return n / 100;
}