// REQ-14-03/04/06: transforma la ProyeccionPyg del backend en filas de tabla
// con cifras del núcleo multi-moneda (REQ-20-03) y marca histórico/proyectado.
import type { ProyeccionPyg, FilaProyeccionPyg } from '../entities/pyg-proyeccion.ts';
import type { Moneda } from '../entities/moneda.ts';
import { formatoMoneda } from './formato-moneda.ts';

/** Fila lista para renderizar: todos los importes ya formateados + tipo (historico/proyectado). */
export interface FilaTablaProyeccion {
  readonly mes: string;
  readonly tipo: 'historico' | 'proyectado';
  readonly ingresos: string;
  readonly gastos: string;
  readonly utilidad: string;
  readonly ahorroAcumulado: string;
}

/** Mensaje del estado vacío (REQ-14-05): invita a registrar el primer mes. */
export const MENSAJE_SIN_HISTORICO =
  'Aún no hay ningún mes registrado. Ve a la sección Registro para ' +
  'registrar tu primer mes y poder ver aquí la proyección.';

/** IF no hay registros históricos THEN la proyección muestra el estado vacío. */
export function serieProyeccionVacia(proyeccion: ProyeccionPyg): boolean {
  return proyeccion.filas_historicas.length === 0;
}

function filaDeTabla(
  fila: FilaProyeccionPyg,
  tipo: 'historico' | 'proyectado',
  moneda: Moneda,
): FilaTablaProyeccion {
  return {
    mes: fila.mes,
    tipo,
    ingresos: formatoMoneda(fila.ingresos, moneda),
    gastos: formatoMoneda(fila.gastos, moneda),
    utilidad: formatoMoneda(fila.utilidad, moneda),
    ahorroAcumulado: formatoMoneda(fila.ahorro_acumulado, moneda),
  };
}

/** Filas formateadas de la tabla: primero históricas (ordenadas), luego proyectadas (ordenadas). */
export function filasDeTablaProyeccion(
  proyeccion: ProyeccionPyg,
  moneda: Moneda,
): FilaTablaProyeccion[] {
  const historicas = proyeccion.filas_historicas.map((f) => filaDeTabla(f, 'historico', moneda));
  const proyectadas = proyeccion.filas_proyectadas.map((f) => filaDeTabla(f, 'proyectado', moneda));
  return [...historicas, ...proyectadas];
}