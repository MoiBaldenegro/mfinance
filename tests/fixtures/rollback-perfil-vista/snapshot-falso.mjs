// Sustituto del adapter Tauri IPC de snapshots para la integración real:
// misma forma de SnapshotPort usada por este flujo, sin invoke().
// El snapshot del objetivo Beto siempre falla; Ana falla solo cuando
// escenario.fallosAna tiene créditos pendientes (rollback roto).
import { SNAPSHOT_VACIO } from '../../../src/domain/entities/finance-snapshot.ts';
import { escenario } from './escenario-falso.mjs';

async function obtenerPerfilActivoConOnboarding() {
  escenario.cargas += 1;
  if (escenario.activaId === 'p-beto') throw new Error('snapshot ilegible');
  if (escenario.fallosAna > 0) {
    escenario.fallosAna -= 1;
    throw new Error('snapshot anterior corrupto');
  }
  return { snapshot: SNAPSHOT_VACIO, onboarding_status: { nombre: 'Completed' } };
}

/** Las demás consultas del shell quedan pendientes: no afectan al flujo. */
const colgada = () => new Promise(() => {});

export const snapshotPort = new Proxy(
  { obtenerPerfilActivoConOnboarding },
  {
    get(objetivo, propiedad) {
      if (propiedad in objetivo) return objetivo[propiedad];
      return colgada;
    },
  },
);
