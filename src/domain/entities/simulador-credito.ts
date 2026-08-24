// Espejo de src-tauri/src/application/simulador_creditos/: tipos de cable
// serde del simulador de créditos sandbox (REQ-15).

/** Crédito hipotético configurado por el usuario. */
export interface CreditoSimulado {
  readonly nombre: string;
  readonly importe: number;
  readonly plazo_meses: number;
  readonly tasa_interes_anual: number;
}

/** Pago extraordinario puntual al final de un mes concreto. */
export interface ExtraordinarioPuntual {
  readonly mes: number;
  readonly importe: number;
}

/** Extras del escenario optimizado. */
export interface ExtrasOptimizacion {
  readonly extra_mensual: number;
  readonly extraordinarios: readonly ExtraordinarioPuntual[];
}

/** Petición del simulador para un crédito. */
export interface PeticionSimulacion {
  readonly credito: CreditoSimulado;
  readonly extras: ExtrasOptimizacion;
}

/** Petición de plan estratégico sobre varios créditos simulados. */
export interface PeticionPlanCreditos {
  readonly creditos: readonly CreditoSimulado[];
  readonly extra_mensual: number;
}

/** Fila mes a mes de la tabla de amortización. */
export interface FilaAmortizacion {
  readonly mes: number;
  readonly cuota: number;
  readonly interes: number;
  readonly capital: number;
  readonly saldo_restante: number;
  readonly total_acumulado: number;
}

/** Resultado completo de amortizar un crédito. */
export interface ResultadoCredito {
  readonly cuota_mensual: number;
  readonly meses: number;
  readonly intereses_totales: number;
  readonly total_pagado: number;
  readonly tabla: readonly FilaAmortizacion[];
}

/** Comparación del escenario base contra el optimizado. */
export interface SimulacionComparada {
  readonly base: ResultadoCredito;
  readonly optimizado: ResultadoCredito;
  readonly meses_ahorrados: number;
  readonly intereses_ahorrados: number;
}

/** Estrategia aplicable sobre varios créditos simulados. */
export type EstrategiaSandbox = 'Avalanche' | 'Snowball';
