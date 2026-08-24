// Lógica pura para obtener indicadores - testeable sin React.
import type { Indicadores } from '../entities/indicadores.ts';
import type { SnapshotPort } from '../ports/snapshot-port.ts';
import { obtenerIndicadores } from './obtener-indicadores.ts';

/** Estado inicial de carga para los indicadores. */
export const INDICADORES_INICIALES: Indicadores = {
  endeudamiento: { nombre: 'Endeudamiento', valor: 0, clasificacion: 'rojo', sin_datos: true, explicacion: 'Cargando...' },
  tasa_ahorro: { nombre: 'Tasa de ahorro', valor: 0, clasificacion: 'rojo', sin_datos: true, explicacion: 'Cargando...' },
  fondo_emergencia: { nombre: 'Fondo de emergencia', valor: 0, clasificacion: 'rojo', sin_datos: true, explicacion: 'Cargando...' },
  ingreso_pasivo: { nombre: 'Ingreso pasivo', valor: 0, clasificacion: 'rojo', sin_datos: true, explicacion: 'Cargando...' },
};

/**
 * Carga los indicadores desde el backend vía el puerto.
 * Función pura testeable sin React.
 * @param port Puerto del snapshot
 * @returns Promise con los 4 indicadores
 */
export async function cargarIndicadores(port: SnapshotPort): Promise<Indicadores> {
  return obtenerIndicadores(port);
}