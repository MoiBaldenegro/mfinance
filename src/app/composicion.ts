// Composition root del frontend: ÚNICO módulo que elige las
// implementaciones concretas (adaptadores IPC de Tauri) de cada puerto.
import { cierrePort } from '../adapters/cierre-ipc-adapter.ts';
import { diagnosticoPort } from '../adapters/diagnostico-ipc-adapter.ts';
import { onboardingPort } from '../adapters/onboarding-adapter.ts';
import { perfilPort } from '../adapters/perfil-ipc-adapter.ts';
import { simuladorPort } from '../adapters/simulador-ipc-adapter.ts';
import { snapshotPort } from '../adapters/snapshot-ipc-adapter.ts';

export const puertosDeProduccion = {
  snapshot: snapshotPort,
  perfil: perfilPort,
  cierre: cierrePort,
  diagnostico: diagnosticoPort,
  simulador: simuladorPort,
  onboarding: onboardingPort,
} as const;
