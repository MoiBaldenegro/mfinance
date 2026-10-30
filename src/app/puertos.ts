// Puertos que la UI necesita, inyectados por contexto. La UI depende solo
// de las interfaces del dominio; las implementaciones las decide el
// composition root (./composicion.ts) o un test con dobles.
import { createContext, useContext } from 'react';
import type { CierrePort } from '../domain/ports/cierre-port.ts';
import type { DiagnosticoPort } from '../domain/ports/diagnostico-port.ts';
import type { OnboardingPort } from '../domain/ports/onboarding-port.ts';
import type { PerfilPort } from '../domain/ports/perfil-port.ts';
import type { SimuladorPort } from '../domain/ports/simulador-port.ts';
import type { SnapshotPort } from '../domain/ports/snapshot-port.ts';
import { puertosDeProduccion } from './composicion.ts';

export interface Puertos {
  readonly snapshot: SnapshotPort;
  readonly perfil: PerfilPort;
  readonly cierre: CierrePort;
  readonly diagnostico: DiagnosticoPort;
  readonly simulador: SimuladorPort;
  readonly onboarding: OnboardingPort;
}

/** Por defecto, los adaptadores reales; un Provider puede sustituirlos. */
export const PuertosContext = createContext<Puertos>(puertosDeProduccion);

export function usarPuertos(): Puertos {
  return useContext(PuertosContext);
}
