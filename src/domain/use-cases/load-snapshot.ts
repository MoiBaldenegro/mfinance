// REQ-05-03/07: caso de uso de carga inicial del snapshot. Consume un
// SnapshotPort inyectado y expone siempre un resultado explícito con el
// snapshot o un error nombrado en español (nunca fallos silenciosos).
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import {
  motivoDeRechazoIpc,
  SnapshotLoadError,
} from '../errors/snapshot-errors.ts';
import type { SnapshotPort } from '../ports/snapshot-port.ts';

/** Carga exitosa con el snapshot listo para la UI. */
export interface CargaExitosa {
  readonly ok: true;
  readonly snapshot: FinanceSnapshot;
}

/** Carga fallida con el error nombrado correspondiente. */
export interface CargaFallida {
  readonly ok: false;
  readonly error: SnapshotLoadError;
}

export type ResultadoCarga = CargaExitosa | CargaFallida;

/**
 * Pide el snapshot al puerto y clasifica el desenlace para poblar el
 * estado compartido de la UI.
 */
export async function cargarSnapshot(port: SnapshotPort): Promise<ResultadoCarga> {
  try {
    const snapshot = await port.load();
    return { ok: true, snapshot };
  } catch (error: unknown) {
    return {
      ok: false,
      error: new SnapshotLoadError(motivoDeRechazoIpc(error)),
    };
  }
}

