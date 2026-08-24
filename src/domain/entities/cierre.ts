// Espejo de los tipos del cierre mensual (REQ-16) tal cual llegan por
// IPC desde src-tauri/src/application/cierre/tipos.rs y del assessment
// persistido en el snapshot (domain/monthly_assessment.rs).
import type { ExpenseCategory } from './catalogs.ts';
import type { MonthKey } from './month-key.ts';

/** Severidad de una recomendación heredada del semáforo. */
export type Severidad = 'rojo' | 'amarillo' | 'verde';

/** Recomendación accionable en español producida por las reglas backend. */
export interface Recomendacion {
  readonly severidad: Severidad;
  readonly titulo: string;
  readonly texto: string;
}

/** Evolución mensual del flujo de caja para el paso Repaso. */
export interface MesFlujo {
  readonly mes: string;
  readonly ingresos: number;
  readonly gastos: number;
  readonly utilidad: number;
}

/** Patrimonio actual para el paso Repaso. */
export interface PatrimonioActual {
  readonly activos: number;
  readonly pasivos: number;
  readonly patrimonio: number;
}

/** Presupuesto por categoría tal cual viaja por el cable serde. */
export type Presupuesto = Partial<Record<ExpenseCategory, number>>;

/** Resumen que alimenta los pasos del wizard (cierre_resumen_cmd). */
export interface ResumenCierre {
  readonly mes: string;
  readonly flujo: readonly MesFlujo[];
  readonly patrimonio: PatrimonioActual;
  readonly presupuesto_sugerido: Presupuesto;
  readonly cerrado: boolean;
}

/** Petición de confirmación del wizard (cierre_confirmar_cmd). */
export interface PeticionCierre {
  readonly mes: string;
  readonly presupuesto_siguiente: Presupuesto;
}

/** Foto de un indicador congelada al cierre. */
export interface IndicadorCerrado {
  readonly nombre: string;
  readonly valor: number | null;
  readonly clasificacion: string;
}

/** Assessment persistido de un mes cerrado (REQ-16-03/08). */
export interface AssessmentRegistro {
  readonly mes: MonthKey;
  readonly fecha_cierre: string;
  readonly indicadores: readonly IndicadorCerrado[];
  readonly presupuesto_siguiente: Presupuesto;
}
