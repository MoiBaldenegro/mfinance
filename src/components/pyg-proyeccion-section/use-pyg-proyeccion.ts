// Hook de la sección Proyección: pide la proyección PyG y el balance
// futuro al puerto cada vez que cambian el snapshot o los supuestos
// confirmados. Glue de UI: el cálculo vive en el backend y las
// transformaciones puras en los use-cases del dominio.
import { useEffect, useState } from 'react';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { ProyeccionPyg, BalanceFuturo, SupuestosProyeccion } from '../../domain/entities/pyg-proyeccion.ts';

export type EstadoProyeccion =
  | { readonly nombre: 'calculando' }
  | { readonly nombre: 'lista'; readonly proyeccion: ProyeccionPyg; readonly balance: BalanceFuturo }
  | { readonly nombre: 'error'; readonly motivo: string };

const MOTIVO_POR_OMISION = 'No se pudo calcular la proyección.';

interface UsePygProyeccionResultado {
  readonly estado: EstadoProyeccion;
}

/** Carga proyección PyG + balance futuro reflejando snapshot y supuestos. */
export function usePygProyeccion(
  snapshot: FinanceSnapshot,
  supuestos: SupuestosProyeccion,
): UsePygProyeccionResultado {
  const [estado, setEstado] = useState<EstadoProyeccion>({ nombre: 'calculando' });

  useEffect(() => {
    let vigente = true;
    setEstado({ nombre: 'calculando' });

    Promise.all([
      snapshotPort.pygProyeccion(supuestos),
      snapshotPort.balanceFuturo(supuestos),
    ])
      .then(([proyeccion, balance]) => {
        if (vigente) setEstado({ nombre: 'lista', proyeccion, balance });
      })
      .catch((error: unknown) => {
        if (!vigente) return;
        const motivo = error instanceof Error && error.message
          ? error.message
          : MOTIVO_POR_OMISION;
        setEstado({ nombre: 'error', motivo });
      });

    return () => { vigente = false; };
  }, [snapshot, supuestos]);

  return { estado };
}
