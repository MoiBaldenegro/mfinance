// Adapter Tauri IPC del puerto de cierre (REQ-16). ÚNICO módulo del
// cierre que invoca invoke(); los errores llegan nombrados desde el
// backend (codigo + mensaje) y se reconstruyen como Error con su motivo.
import { invoke } from '@tauri-apps/api/core';
import type { FinanceSnapshot } from '../domain/entities/finance-snapshot.ts';
import type {
  PeticionCierre,
  Recomendacion,
  ResumenCierre,
} from '../domain/entities/cierre.ts';
import type { CierrePort } from '../domain/ports/cierre-port.ts';

async function llamar<T>(
  comando: string,
  argumentos: Record<string, unknown>,
): Promise<T> {
  try {
    return await invoke<T>(comando, argumentos);
  } catch (error: unknown) {
    const motivo =
      typeof error === 'object' && error !== null && 'mensaje' in error
        ? String((error as { mensaje?: unknown }).mensaje)
        : 'No se pudo completar la operación de cierre.';
    throw new Error(motivo);
  }
}

/** Instancia única del puerto del cierre para toda la app. */
class CierreIpcAdapter implements CierrePort {
  resumenCierre(mes: string): Promise<ResumenCierre> {
    return llamar<ResumenCierre>('cierre_resumen_cmd', { mes });
  }

  confirmarCierre(peticion: PeticionCierre): Promise<FinanceSnapshot> {
    return llamar<FinanceSnapshot>('cierre_confirmar_cmd', { peticion });
  }

  reabrirMes(mes: string): Promise<FinanceSnapshot> {
    return llamar<FinanceSnapshot>('cierre_reabrir_cmd', { mes });
  }

  consejosVigentes(): Promise<readonly Recomendacion[]> {
    return llamar<readonly Recomendacion[]>('consejos_cmd', {});
  }
}

export const cierrePort: CierrePort = new CierreIpcAdapter();
