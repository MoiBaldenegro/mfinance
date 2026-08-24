// Hook de reapertura explícita de un mes cerrado (REQ-16-07): llama al
// puerto del cierre y publica el snapshot devuelto en el provider.
import { useCallback, useState } from 'react';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { cierrePort } from '../../adapters/cierre-ipc-adapter.ts';

export function useReapertura(
  aplicarSnapshot: (nuevo: FinanceSnapshot) => void,
) {
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const reabrir = useCallback(
    async (mes: string) => {
      if (ocupado) return;
      setOcupado(true);
      setAviso(null);
      try {
        const nuevo = await cierrePort.reabrirMes(mes);
        aplicarSnapshot(nuevo);
      } catch (error: unknown) {
        setAviso(`No se pudo reabrir el mes: ${(error as Error).message}`);
      } finally {
        setOcupado(false);
      }
    },
    [aplicarSnapshot, ocupado],
  );

  return { ocupado, aviso, reabrir };
}
