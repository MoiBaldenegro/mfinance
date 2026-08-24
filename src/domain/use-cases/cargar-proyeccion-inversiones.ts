// Caso de uso: cargar la proyección de inversiones vía puerto (REQ-11-02).
import type { SnapshotPort } from '../ports/snapshot-port.ts';
import type { ProyeccionInversiones } from '../entities/proyeccion-inversiones.ts';

export async function cargarProyeccionInversiones(
  port: SnapshotPort,
): Promise<ProyeccionInversiones> {
  return port.inversionesProyeccion();
}