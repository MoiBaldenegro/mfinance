// Estado de tema de la UI (glue de lib/, como chart-colores.ts): guarda el
// tema activo, lo aplica sobre <html> vía data-theme y notifica a los
// suscriptores React (hooks/use-tema) cuando cambia. La persistencia va
// SIEMPRE por el puerto TemaPort inyectado en iniciarTema; aquí no hay
// acceso directo a storage.
import type { Tema } from '../domain/entities/tema.ts';
import type { TemaPort } from '../domain/ports/tema-port.ts';
import { alternarTema, resolverTema } from '../domain/use-cases/resolver-tema.ts';

type Oyente = () => void;

let puerto: TemaPort | null = null;
let activo: Tema = 'oscuro';
const oyentes = new Set<Oyente>();

/** Aplica el tema sobre el elemento raíz del documento (REQ-17-08). */
function aplicarDom(tema: Tema): void {
  document.documentElement.setAttribute('data-theme', tema);
}

/** Arranque (main.tsx, ANTES del primer render): resuelve y aplica. */
export function iniciarTema(port: TemaPort): Tema {
  puerto = port;
  activo = resolverTema(port.leer());
  aplicarDom(activo);
  return activo;
}

/** Tema activo actual (getter estable para useSyncExternalStore). */
export function temaActual(): Tema {
  return activo;
}

/** Suscripción para useSyncExternalStore; devuelve la desuscripción. */
export function suscribirse(oyente: Oyente): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/** Conmutador de Ajustes (REQ-17-02/03): alterna, persiste y aplica. */
export function conmutarTema(): Tema {
  activo = alternarTema(activo);
  aplicarDom(activo);
  puerto?.guardar(activo);
  for (const oyente of oyentes) oyente();
  return activo;
}
