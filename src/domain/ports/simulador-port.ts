// Puerto del núcleo frontend para el simulador de créditos sandbox
// (REQ-15): lo define el dominio, lo implementa el adapter IPC y lo
// consumen los casos de uso. Operaciones puras de cálculo: jamás mutan
// el snapshot ni los pasivos reales.
import type {
  PeticionPlanCreditos,
  PeticionSimulacion,
  SimulacionComparada,
} from '../entities/simulador-credito.ts';
import type { PlanCreditosSimulados } from '../entities/simulador-plan.ts';

export interface SimuladorPort {
  /** REQ-15-01/02/04/05: comparación base vs optimizado de un crédito. */
  simularCredito(peticion: PeticionSimulacion): Promise<SimulacionComparada>;
  /** REQ-15-03: avalancha/bola de nieve sobre varios créditos simulados. */
  simularPlanCreditos(
    peticion: PeticionPlanCreditos,
  ): Promise<PlanCreditosSimulados>;
}
