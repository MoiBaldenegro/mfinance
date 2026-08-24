// REQ-13-01..07: lógica pura de conciliación para el frontend.
// Cálculo de diferencia, estado conciliado/descuadrada, formateo,
// validaciones; sin React ni IPC.
import type { ConciliacionMensual } from '../entities/conciliacion-mensual.ts';
import type { Movement } from '../entities/account-statement.ts';
import type { Moneda } from '../entities/moneda.ts';
import { formatoMoneda } from './formato-moneda.ts';

/** Formatea un importe con la moneda activa del snapshot (REQ-20-03). */
export function formatearImporte(importe: number, moneda: Moneda): string {
  return formatoMoneda(importe, moneda);
}

/** Clase CSS para el estado de conciliación. */
export function claseEstadoConciliada(conciliada: boolean): string {
  return conciliada ? 'conciliacion__estado--conciliada' : 'conciliacion__estado--descuadrada';
}

/** Texto legible del estado de conciliación. */
export function textoEstadoConciliada(conciliada: boolean): string {
  return conciliada ? 'Conciliada' : 'Descuadrada';
}

/** Valida un movimiento antes de enviarlo al backend. */
export function validarMovimiento(movimiento: Movement): string | null {
  if (!movimiento.concepto || movimiento.concepto.trim() === '') {
    return 'El concepto es obligatorio';
  }
  if (!Number.isFinite(movimiento.importe)) {
    return 'El importe debe ser un número válido';
  }
  if (movimiento.importe === 0) {
    return 'El importe no puede ser cero';
  }
  if (!movimiento.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(movimiento.fecha)) {
    return 'La fecha debe tener formato YYYY-MM-DD';
  }
  return null;
}

/** Verifica si todas las cuentas de una conciliación mensual están conciliadas. */
export function todasConciliadas(conciliacion: ConciliacionMensual): boolean {
  return conciliacion.todas_conciliadas;
}

/** Calcula el total de diferencias absolutas (para mostrar magnitud total descuadres). */
export function totalDescuadres(conciliacion: ConciliacionMensual): number {
  return conciliacion.cuentas
    .filter((c) => !c.conciliada)
    .reduce((total, c) => total + Math.abs(c.diferencia), 0);
}