// Caso de uso front: obtiene los indicadores semáforo del backend vía el
// puerto (REQ-10-01). Puro: sin React ni IPC; solo delega en el puerto.
import type { Indicadores } from '../entities/indicadores.ts';
import type { SnapshotPort } from '../ports/snapshot-port.ts';

/** Obtiene los cuatro indicadores semáforo del backend. */
export async function obtenerIndicadores(
  port: SnapshotPort,
): Promise<Indicadores> {
  return port.indicadores();
}