// Hook de la sección Balance: carga la serie de patrimonio y expone el
// CRUD de activos/pasivos. Cada mutación publica el snapshot devuelto por
// el backend (las tablas se refrescan al instante) y recalcula la serie
// sin volver a la pantalla de carga. Los fallos de una operación no
// sustituyen la sección: se muestran junto a ella.
import { useCallback, useEffect, useState } from 'react';
import { usarPuertos } from '../../app/puertos.ts';
import type { BalanceCompleto, TotalesBalance } from '../../domain/entities/balance-serie.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { CategoriaActivo } from '../../domain/entities/asset.ts';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';

const motivo = (e: unknown, defecto: string) => (e instanceof Error ? e.message : defecto);

export function useBalance() {
  const { snapshot: snapshotPort } = usarPuertos();
  const { aplicarSnapshot } = useSnapshot();
  const [balance, setBalance] = useState<BalanceCompleto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorOperacion, setErrorOperacion] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargarSerie = useCallback(async () => {
    try {
      setBalance(await snapshotPort.balanceSerie());
      setErrorCarga(null);
    } catch (e: unknown) {
      setErrorCarga(motivo(e, 'No se pudo cargar el balance'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargarSerie(); }, [cargarSerie]);

  /** Ejecuta la mutación; resuelve true si se guardó. */
  const mutar = useCallback(async (fn: () => Promise<FinanceSnapshot>): Promise<boolean> => {
    setOcupado(true);
    setErrorOperacion(null);
    try {
      aplicarSnapshot(await fn());
      await cargarSerie();
      return true;
    } catch (e: unknown) {
      setErrorOperacion(motivo(e, 'No se pudo guardar el cambio'));
      return false;
    } finally {
      setOcupado(false);
    }
  }, [aplicarSnapshot, cargarSerie]);

  const totales: TotalesBalance | null = balance?.totales ?? null;
  return {
    balance, totales, cargando, errorCarga, errorOperacion, ocupado,
    reintentar: cargarSerie,
    assetUpsert: (nombre: string, categoria: CategoriaActivo, valor: number) =>
      mutar(() => snapshotPort.assetUpsert(nombre, categoria, valor)),
    assetEliminar: (nombre: string) => mutar(() => snapshotPort.assetEliminar(nombre)),
    liabilityUpsert: (nombre: string, saldo: number, tasa: number) =>
      mutar(() => snapshotPort.liabilityUpsert(nombre, saldo, tasa)),
    liabilityEliminar: (nombre: string) => mutar(() => snapshotPort.liabilityEliminar(nombre)),
  };
}
