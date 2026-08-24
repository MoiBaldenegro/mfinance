// REQ-24-01: pasos del wizard de onboarding.
// Espejo de src-tauri/src/domain/onboarding/data.rs, pasos.rs. Sin imports externos.
import type { Moneda } from '../moneda.ts';

/** Paso 1: datos personales, moneda, fuentes ingreso, categorías gasto (REQ-24-06/07/08). */
export interface Paso1Data {
  readonly nombre_completo: string;
  readonly moneda: Moneda;
  readonly fuentes_ingreso_activas: readonly string[];
  readonly categorias_gasto_usadas: readonly string[];
}

/** Paso 2: balance inicial (activos, pasivos, inversiones) — opcional. */
export interface Paso2Data {
  readonly activos: readonly OnboardingActivo[];
  readonly pasivos: readonly OnboardingPasivo[];
  readonly inversiones: readonly OnboardingInversion[];
}

/** Paso 3: deuda y proyección — opcional. */
export interface Paso3Data {
  readonly estrategia_deuda: 'Avalanche' | 'Snowball';
  readonly pago_extra_mensual: number;
  readonly supuestos_proyeccion: readonly SupuestoProyeccion[];
}

/** Paso 4: umbrales indicadores (espejo del backend; metas → goals_journal). */
export interface Paso4Data {
  readonly umbrales: UmbralesIndicadores;
}

/** Activo simplificado para onboarding. */
export interface OnboardingActivo {
  readonly nombre: string;
  readonly categoria: 'liquido' | 'inversion' | 'propiedad';
  readonly valor_actual: number;
}

/** Pasivo simplificado para onboarding. */
export interface OnboardingPasivo {
  readonly nombre: string;
  readonly saldo_pendiente: number;
  readonly tasa_interes_anual: number;
}

/** Inversión simplificada para onboarding. */
export interface OnboardingInversion {
  readonly familia: 'renta_fija' | 'renta_variable' | 'finca_raiz';
  readonly aporte_mensual: number;
  readonly valor_actual: number;
  readonly tasa_esperada_anual: number;
}

/** Supuesto de proyección (% por variable). */
export interface SupuestoProyeccion {
  readonly variable: string;
  readonly porcentaje: number; // -50 a +100
}

/**
 * Umbrales de los 4 indicadores (espejo de UmbralesIndicadores del
 * backend, REQ-23-05): null = usar el valor por defecto del semáforo.
 */
export interface UmbralesIndicadores {
  readonly endeudamiento_verde: number | null;
  readonly endeudamiento_rojo: number | null;
  readonly ahorro_verde: number | null;
  readonly ahorro_rojo: number | null;
  readonly fondo_verde: number | null;
  readonly fondo_rojo: number | null;
  readonly ingreso_pasivo_verde: number | null;
  readonly ingreso_pasivo_amarillo: number | null;
}

/** Paso1Data por defecto para nuevo onboarding. */
export function paso1DataPorDefecto(): Paso1Data {
  return {
    nombre_completo: '',
    moneda: 'MXN',
    fuentes_ingreso_activas: [],
    categorias_gasto_usadas: [],
  };
}