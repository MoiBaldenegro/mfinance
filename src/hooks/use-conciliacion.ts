// REQ-13-01..07: hook para cargar conciliación y histórico.
// Delega en el puerto inyectado vía SnapshotProvider; expone estado
// y acciones para la UI.
import { useCallback, useState } from 'react';
import { snapshotPort } from '../adapters/snapshot-ipc-adapter.ts';
import type { ConciliacionMensual } from '../domain/entities/conciliacion-mensual.ts';
import type { HistoricoConciliacion } from '../domain/entities/conciliacion-mensual.ts';
import type { FinanceSnapshot } from '../domain/entities/finance-snapshot.ts';
import type { SnapshotLoadError } from '../domain/errors/snapshot-errors.ts';

type EstadoConciliacion =
  | { readonly nombre: 'cargando' }
  | { readonly nombre: 'listo'; readonly conciliacion: ConciliacionMensual }
  | { readonly nombre: 'error'; readonly error: SnapshotLoadError };

type EstadoHistorico =
  | { readonly nombre: 'cargando' }
  | { readonly nombre: 'listo'; readonly historico: HistoricoConciliacion }
  | { readonly nombre: 'error'; readonly error: SnapshotLoadError };

/** Hook para la conciliación de un mes específico. */
export function useConciliacion(mes: string) {
  const [estado, setEstado] = useState<EstadoConciliacion>({ nombre: 'cargando' });

  const cargar = useCallback(async () => {
    setEstado({ nombre: 'cargando' });
    try {
      const conciliacion = await snapshotPort.conciliacionMensual(mes);
      setEstado({ nombre: 'listo', conciliacion });
    } catch (error: unknown) {
      const err = error as SnapshotLoadError;
      setEstado({ nombre: 'error', error: err });
    }
  }, [mes]);

  return { estado, recargar: cargar };
}

/** Hook para el histórico de conciliación. */
export function useHistoricoConciliacion() {
  const [estado, setEstado] = useState<EstadoHistorico>({ nombre: 'cargando' });

  const cargar = useCallback(async () => {
    setEstado({ nombre: 'cargando' });
    try {
      const historico = await snapshotPort.conciliacionHistorico();
      setEstado({ nombre: 'listo', historico });
    } catch (error: unknown) {
      const err = error as SnapshotLoadError;
      setEstado({ nombre: 'error', error: err });
    }
  }, []);

  return { estado, recargar: cargar };
}

/** Hook para agregar un movimiento y recargar. */
export function useAgregarMovimientoConciliacion(
  mes: string,
  onSnapshotActualizado: (snapshot: FinanceSnapshot) => void,
) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agregar = useCallback(
    async (cuenta: string, movimiento: { fecha: string; concepto: string; importe: number }) => {
      setGuardando(true);
      setError(null);
      try {
        const snapshot = await snapshotPort.conciliacionAgregarMovimiento(mes, cuenta, movimiento);
        onSnapshotActualizado(snapshot);
      } catch (err: unknown) {
        const e = err as SnapshotLoadError;
        setError(e.message ?? 'Error al agregar movimiento');
      } finally {
        setGuardando(false);
      }
    },
    [mes, onSnapshotActualizado],
  );

  return { agregar, guardando, error };
}