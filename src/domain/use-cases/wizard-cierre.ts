// REQ-16-01: máquina de estados del wizard de cierre: cuatro pasos con
// navegación atrás/continuar y barra de progreso. Puro y sin React.
export const PASOS_WIZARD = [
  'repaso',
  'presupuesto',
  'assessment',
  'confirmacion',
] as const;

/** Identificador de paso del wizard. */
export type PasoWizard = typeof PASOS_WIZARD[number];

/** Estado mínimo del wizard: índice del paso activo. */
export interface EstadoWizard {
  readonly paso: number;
}

/** Rótulos en español de cada paso para la barra de progreso. */
export const ETIQUETAS_PASOS: readonly string[] = [
  'Repaso',
  'Presupuesto',
  'Assessment',
  'Confirmación',
];

/** Wizard recién arrancado en el primer paso. */
export function crearWizard(): EstadoWizard {
  return { paso: 0 };
}

/** Continuar: avanza un paso sin salir del último (REQ-16-01). */
export function avanzar(estado: EstadoWizard): EstadoWizard {
  const ultimo = PASOS_WIZARD.length - 1;
  return { paso: Math.min(estado.paso + 1, ultimo) };
}

/** Atrás: retrocede un paso sin bajar del primero. */
export function retroceder(estado: EstadoWizard): EstadoWizard {
  return { paso: Math.max(estado.paso - 1, 0) };
}

/** Porcentaje completado para la barra de progreso (25% por paso). */
export function progresoWizard(paso: number): number {
  return Math.round(((paso + 1) / PASOS_WIZARD.length) * 100);
}
