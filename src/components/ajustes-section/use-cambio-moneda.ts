// REQ-20-01: caso de uso de UI para el selector de moneda de Ajustes.
// Cambia strategy.currency del snapshot (validado por cambiarMoneda),
// persiste por el puerto existente (save_state) y publica el snapshot
// nuevo para que toda la app reformatee al instante (REQ-20-02).
import { useCallback, useState } from 'react';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { Moneda } from '../../domain/entities/moneda.ts';
import { cambiarMoneda } from '../../domain/use-cases/cambiar-moneda.ts';
import { motivoDeRechazoIpc } from '../../domain/errors/snapshot-errors.ts';

export type ResultadoCambio = { readonly ok: boolean; readonly aviso?: string };

/** Gancho del selector: expone la acción de cambio y su aviso de error. */
export function useCambioMoneda(
  snapshot: FinanceSnapshot,
  aplicarSnapshot: (snapshot: FinanceSnapshot) => void,
) {
  const [aviso, setAviso] = useState<string | null>(null);

  const cambiar = useCallback(
    async (moneda: Moneda): Promise<void> => {
      setAviso(null);
      const nuevo = cambiarMoneda(snapshot, moneda);
      try {
        await snapshotPort.save(nuevo);
      } catch (error: unknown) {
        setAviso(
          `No se pudo guardar la moneda: ${motivoDeRechazoIpc(error)}`,
        );
        return;
      }
      aplicarSnapshot(nuevo);
    },
    [snapshot, aplicarSnapshot],
  );

  return { cambiar, aviso };
}
