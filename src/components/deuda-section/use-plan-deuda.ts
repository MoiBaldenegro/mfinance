// Hook de la sección Deuda: pide el plan al puerto y la refresca cada vez
// que cambia el snapshot publicado (REQ-09-05). Glue de UI: el cálculo
// vive en el backend y las transformaciones en use-cases.
import { useEffect, useState } from 'react';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { PlanDeuda } from '../../domain/entities/plan-deuda.ts';

export type EstadoPlanDeuda =
  | { readonly nombre: 'calculando' }
  | { readonly nombre: 'listo'; readonly plan: PlanDeuda }
  | { readonly nombre: 'error'; readonly motivo: string };

const MOTIVO_POR_OMISION = 'No se pudo calcular el plan de deuda.';

export function usePlanDeuda(snapshot: FinanceSnapshot): EstadoPlanDeuda {
  const [estado, setEstado] = useState<EstadoPlanDeuda>({ nombre: 'calculando' });

  useEffect(() => {
    let vigente = true;
    setEstado({ nombre: 'calculando' });
    snapshotPort
      .planDeuda()
      .then((plan) => {
        if (vigente) setEstado({ nombre: 'listo', plan });
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
    // El plan depende solo de los datos publicados; se recalcula al cambiar.
  }, [snapshot]);

  return estado;
}