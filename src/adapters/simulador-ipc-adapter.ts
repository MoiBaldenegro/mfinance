// Adapter Tauri IPC del puerto del simulador (REQ-15). ÚNICO módulo del
// simulador que invoca invoke(); los errores llegan nombrados desde el
// backend (codigo + mensaje) y se reconstruyen como Error con su motivo.
import { invoke } from '@tauri-apps/api/core';
import type {
  PeticionPlanCreditos,
  PeticionSimulacion,
  SimulacionComparada,
} from '../domain/entities/simulador-credito.ts';
import type { PlanCreditosSimulados } from '../domain/entities/simulador-plan.ts';
import type { SimuladorPort } from '../domain/ports/simulador-port.ts';

async function llamar<T>(comando: string, argumentos: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(comando, argumentos);
  } catch (error: unknown) {
    const motivo =
      typeof error === 'object' && error !== null && 'mensaje' in error
        ? String((error as { mensaje?: unknown }).mensaje)
        : 'No se pudo simular el crédito.';
    throw new Error(motivo);
  }
}

/** Instancia única del puerto del simulador para toda la app. */
class SimuladorIpcAdapter implements SimuladorPort {
  simularCredito(peticion: PeticionSimulacion): Promise<SimulacionComparada> {
    return llamar<SimulacionComparada>('simular_credito', { peticion });
  }

  simularPlanCreditos(peticion: PeticionPlanCreditos): Promise<PlanCreditosSimulados> {
    return llamar<PlanCreditosSimulados>('simular_plan_creditos_cmd', { peticion });
  }
}

export const simuladorPort: SimuladorPort = new SimuladorIpcAdapter();
