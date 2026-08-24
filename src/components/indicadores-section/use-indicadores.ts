// Hook para obtener los indicadores semáforo del backend.
// Usa la lógica pura de indicadores-logic y se refresca con el SnapshotProvider.
import { useEffect, useState } from 'react';
import type { Indicadores } from '../../domain/entities/indicadores.ts';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';
import { INDICADORES_INICIALES, cargarIndicadores } from '../../domain/use-cases/indicadores-logic.ts';

/**
 * Hook que obtiene los 4 indicadores semáforo del backend.
 * Se refresca automáticamente cuando el SnapshotProvider llama a recargar.
 * @returns Objeto con los 4 indicadores + función recargar
 */
export function useIndicadores(): Indicadores & { recargar: () => Promise<void> } {
  const [indicadores, setIndicadores] = useState<Indicadores>(INDICADORES_INICIALES);

  const cargar = async () => {
    try {
      const data = await cargarIndicadores(snapshotPort);
      setIndicadores(data);
    } catch (_e) {
      // En caso de error, mantener estado de carga
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // Exponer función de recarga para que SnapshotProvider la use
  return Object.assign(indicadores, { recargar: cargar });
}