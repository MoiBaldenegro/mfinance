// Tipos de resultado del plan estratégico multi-crédito del simulador
// (continuación del espejo de simulador_creditos/resultado.rs).

import type { EstrategiaSandbox } from './simulador-credito.ts';

/** Escenario de una estrategia sobre varios créditos simulados. */
export interface EscenarioEstrategia {
  readonly estrategia: EstrategiaSandbox;
  readonly orden_de_ataque: readonly string[];
  readonly deuda_objetivo: string | null;
  readonly meses_base: number;
  readonly intereses_base: number;
  readonly meses_optimizado: number;
  readonly intereses_optimizado: number;
  readonly meses_ahorrados: number;
  readonly intereses_ahorrados: number;
}

/** Plan estratégico completo: un escenario por estrategia soportada. */
export interface PlanCreditosSimulados {
  readonly escenarios: readonly EscenarioEstrategia[];
}
