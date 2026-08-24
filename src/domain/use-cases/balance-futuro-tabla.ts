// REQ-14-02: transforma el BalanceFuturo del backend en filas de tabla
// con cifras del núcleo multi-moneda (REQ-20-03) y marca histórico/proyectado.
import type { BalanceFuturo, FilaBalanceFuturo } from '../entities/pyg-proyeccion.ts';
import type { Moneda } from '../entities/moneda.ts';
import { formatoMoneda } from './formato-moneda.ts';

/** Fila lista para renderizar: todos los importes ya formateados + tipo (historico/proyectado). */
export interface FilaTablaBalanceFuturo {
  readonly mes: string;
  readonly tipo: 'historico' | 'proyectado';
  readonly activos: string;
  readonly pasivos: string;
  readonly patrimonio: string;
}

/** Mensaje del estado vacío (REQ-14-05): invita a registrar el primer mes. */
export const MENSAJE_SIN_BALANCE_HISTORICO =
  'Aún no hay ningún mes registrado. Ve a la sección Registro para ' +
  'registrar tu primer mes y poder ver aquí el balance futuro.';

/** IF no hay registros históricos THEN el balance futuro muestra el estado vacío. */
export function balanceFuturoVacio(balance: BalanceFuturo): boolean {
  return balance.filas_historicas.length === 0;
}

function filaDeTabla(
  fila: FilaBalanceFuturo,
  tipo: 'historico' | 'proyectado',
  moneda: Moneda,
): FilaTablaBalanceFuturo {
  return {
    mes: fila.mes,
    tipo,
    activos: formatoMoneda(fila.activos, moneda),
    pasivos: formatoMoneda(fila.pasivos, moneda),
    patrimonio: formatoMoneda(fila.patrimonio, moneda),
  };
}

/** Filas formateadas de la tabla: primero históricas, luego proyectadas. */
export function filasDeTablaBalanceFuturo(
  balance: BalanceFuturo,
  moneda: Moneda,
): FilaTablaBalanceFuturo[] {
  const historicas = balance.filas_historicas.map((f) => filaDeTabla(f, 'historico', moneda));
  const proyectadas = balance.filas_proyectadas.map((f) => filaDeTabla(f, 'proyectado', moneda));
  return [...historicas, ...proyectadas];
}