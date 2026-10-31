// REQ-13-01..07: hook para cargar conciliación y histórico.
// Delega en el puerto inyectado vía SnapshotProvider; expone estado
// y acciones para la UI.
import { useCallback, useState } from 'react';
import { usarPuertos } from '../app/puertos.ts';
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
  const { snapshot: snapshotPort } = usarPuertos();
  const [estado, setEstado] = useState<EstadoConciliacion>({ nombre: 'cargando' });

  const cargar = useCallback(async () => {
    // Conserva los datos visibles mientras se recarga el mismo mes.
    setEstado((previo) => (previo.nombre === 'listo' && previo.conciliacion.mes === mes ? previo : { nombre: 'cargando' }));
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
  const { snapshot: snapshotPort } = usarPuertos();
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
  const { snapshot: snapshotPort } = usarPuertos();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agregar = useCallback(
    async (cuenta: string, movimiento: { fecha: string; concepto: string; importe: number }): Promise<boolean> => {
      setGuardando(true);
      setError(null);
      try {
        const snapshot = await snapshotPort.conciliacionAgregarMovimiento(mes, cuenta, movimiento);
        onSnapshotActualizado(snapshot);
        return true;
      } catch (err: unknown) {
        const e = err as SnapshotLoadError;
        setError(e.message ?? 'Error al agregar movimiento');
        return false;
      } finally {
        setGuardando(false);
      }
    },
    [mes, onSnapshotActualizado],
  );

  return { agregar, guardando, error };
}