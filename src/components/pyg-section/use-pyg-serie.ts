// Hook de la sección P&G: pide la serie al puerto y la refresca cada vez
// que cambia el snapshot publicado (REQ-07-05). Glue de UI: el cálculo
// vive en el backend y las transformaciones en use-cases.
import { useEffect, useState } from 'react';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { SeriePyg } from '../../domain/entities/pyg-serie.ts';

export type EstadoSerie =
  | { readonly nombre: 'calculando' }
  | { readonly nombre: 'lista'; readonly serie: SeriePyg }
  | { readonly nombre: 'error'; readonly motivo: string };

/** Texto legible para el fallo del IPC sin exponer detalles técnicos. */
const MOTIVO_POR_OMISION = 'No se pudo calcular la serie mensual.';

export function usePygSerie(snapshot: FinanceSnapshot): EstadoSerie {
  const [estado, setEstado] = useState<EstadoSerie>({ nombre: 'calculando' });

  useEffect(() => {
    let vigente = true;
    setEstado({ nombre: 'calculando' });
    snapshotPort
      .pygSerie()
      .then((serie) => {
        if (vigente) setEstado({ nombre: 'lista', serie });
      })
      .catch((error: unknown) => {
        if (!vigente) return;
        const motivo = error instanceof Error && error.message
          ? error.message
          : MOTIVO_POR_OMISION;
        setEstado({ nombre: 'error', motivo });
      });
    return () => {
      vigente = false;
    };
    // La serie depende solo de los datos publicados; se recalcula al cambiar.
  }, [snapshot]);

  return estado;
}
