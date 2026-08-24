// Hook React del tema activo: suscribe el componente al estado observable
// de lib/estado-tema vía useSyncExternalStore. Las gráficas lo consumen
// para incluir el tema en las dependencias del efecto y redibujarse con
// la paleta activa al conmutar (REQ-17-06).
import { useSyncExternalStore } from 'react';
import { suscribirse, temaActual } from '../lib/estado-tema.ts';

/** Tema activo reactivo: 'oscuro' | 'claro'. */
export function usarTema() {
  return useSyncExternalStore(suscribirse, temaActual);
}
