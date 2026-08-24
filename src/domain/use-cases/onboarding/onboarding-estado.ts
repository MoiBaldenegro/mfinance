// Estado y carga de onboarding (puro TS, sin React)
import type { OnboardingData, OnboardingStatus, Paso1Data } from '../../entities/onboarding/index.ts';
import type { OnboardingPort } from '../../ports/onboarding-port.ts';
import { gestionarOnboarding } from './gestionar-onboarding.ts';

export const DEBOUNCE_MS = 500;

export function estadoInicialDatos(): OnboardingData {
  return { paso1: null, paso2: null, paso3: null, paso4: null };
}

export function paso1PorDefecto(): Paso1Data {
  return { nombre_completo: '', moneda: 'MXN', fuentes_ingreso_activas: [], categorias_gasto_usadas: [] };
}

export interface PuertosOnboarding {
  readonly onboarding: OnboardingPort;
}

export async function cargarEstadoOnboarding(
  puertos: PuertosOnboarding,
  datosIniciales: OnboardingData | undefined,
  pasoInicial: number,
  perfilId?: string,
): Promise<OnboardingStatus> {
  if (datosIniciales) {
    return { nombre: 'InProgress', current_step: pasoInicial };
  }
  const resultado = await gestionarOnboarding.obtenerEstado(puertos, perfilId);
  if (resultado instanceof Error) {
    throw new Error(resultado.message);
  }
  return resultado;
}