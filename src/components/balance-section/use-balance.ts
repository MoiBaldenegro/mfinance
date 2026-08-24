// REQ-08-03/07: hook React para la sección Balance: carga la serie
// de balance, expone operaciones CRUD y refresca el snapshot tras cambios.
import { useCallback, useEffect, useState } from 'react';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';
import type { BalanceCompleto } from '../../domain/entities/balance-serie.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { CategoriaActivo } from '../../domain/entities/asset.ts';
import type { TotalesBalance } from '../../domain/entities/balance-serie.ts';

interface UseBalanceReturn {
  readonly balance: BalanceCompleto | null;
  readonly totales: TotalesBalance | null;
  readonly cargando: boolean;
  readonly error: string | null;
  readonly recargar: () => Promise<void>;
  readonly assetUpsert: (nombre: string, categoria: CategoriaActivo, valorActual: number) => Promise<void>;
  readonly assetEliminar: (nombre: string) => Promise<void>;
  readonly liabilityUpsert: (nombre: string, saldoPendiente: number, tasaInteresAnual: number) => Promise<void>;
  readonly liabilityEliminar: (nombre: string) => Promise<void>;
}

export function useBalance(): UseBalanceReturn {
  const [balance, setBalance] = useState<BalanceCompleto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await snapshotPort.balanceSerie();
      setBalance(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando balance');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  const mutarYRecargar = useCallback(
    async (fn: () => Promise<FinanceSnapshot>) => {
      setError(null);
      try { await fn(); await recargar(); }
      catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error en la operación'); throw e; }
    },
    [recargar],
  );

  const assetUpsert = useCallback(
    (nombre: string, categoria: CategoriaActivo, valorActual: number) =>
      mutarYRecargar(() => snapshotPort.assetUpsert(nombre, categoria, valorActual)),
    [mutarYRecargar],
  );

  const assetEliminar = useCallback(
    (nombre: string) => mutarYRecargar(() => snapshotPort.assetEliminar(nombre)),
    [mutarYRecargar],
  );

  const liabilityUpsert = useCallback(
    (nombre: string, saldoPendiente: number, tasaInteresAnual: number) =>
      mutarYRecargar(() => snapshotPort.liabilityUpsert(nombre, saldoPendiente, tasaInteresAnual)),
    [mutarYRecargar],
  );

  const liabilityEliminar = useCallback(
    (nombre: string) => mutarYRecargar(() => snapshotPort.liabilityEliminar(nombre)),
    [mutarYRecargar],
  );

  return {
    balance, totales: balance?.totales ?? null, cargando, error, recargar,
    assetUpsert, assetEliminar, liabilityUpsert, liabilityEliminar,
  };
}