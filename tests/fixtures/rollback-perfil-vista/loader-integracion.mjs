// Loader del harness de integración: transpila TS/TSX como tsx-loader.mjs
// y además sustituye los dos adapters IPC por dobles deterministas.
import { resolve as resolverTs, load as cargarTs } from './tsx-loader.mjs';

const raiz = new URL('.', import.meta.url);
const REDIRECCIONES = new Map([
  ['perfil-ipc-adapter.ts', new URL('perfil-falso.mjs', raiz).href],
  ['snapshot-ipc-adapter.ts', new URL('snapshot-falso.mjs', raiz).href],
]);

export async function resolve(specifier, contexto, siguiente) {
  const base = specifier.split('?')[0].split('/').pop();
  if (REDIRECCIONES.has(base)) {
    return { url: REDIRECCIONES.get(base), shortCircuit: true };
  }
  return resolverTs(specifier, contexto, siguiente);
}

export const load = cargarTs;
