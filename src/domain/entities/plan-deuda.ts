// Espejo de src-tauri/src/application/plan_deuda.rs: plan de deuda
// completo con órdenes, proyección y métricas.

/** Deuda ordenada para el plan. */
export interface DeudaPlan {
  readonly nombre: string;
  readonly saldo_pendiente: number;
  readonly tasa_interes_anual: number;
  readonly pago_minimo_mensual: number;
}

/** Fila de la proyección mes a mes. */
export interface FilaProyeccionDeuda {
  readonly mes: number;
  readonly saldo_total_restante: number;
  readonly pago_total_mes: number;
  readonly intereses_mes: number;
  readonly principal_mes: number;
}

/** Proyección completa del plan de deuda. */
export interface ProyeccionDeuda {
  readonly filas: readonly FilaProyeccionDeuda[];
  readonly meses_hasta_libre: number;
  readonly intereses_totales: number;
  readonly total_pagado: number;
  readonly intereses_ahorrados: number;
}

/** Plan de deuda completo: órdenes + proyección + deuda objetivo. */
export interface PlanDeuda {
  readonly orden_avalancha: readonly DeudaPlan[];
  readonly orden_bola_nieve: readonly DeudaPlan[];
  readonly proyeccion: ProyeccionDeuda;
  readonly deuda_objetivo: DeudaPlan | null;
}