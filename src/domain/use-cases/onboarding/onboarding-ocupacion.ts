// Semántica de ocupación del wizard de onboarding (feature 33, REQ-33-01..06).
// Módulo puro sin React: editar NUNCA activa la ocupación; ocupado === true
// SOLO mientras el IPC de persistencia parcial está en vuelo; flush y
// restablecer devuelven ocupado=false SIEMPRE, incluso sin guardado pendiente
// o con error. Conserva crearLogicaGuardado como motor de debounce (REQ-25-06).
import { crearLogicaGuardado } from './onboarding-guardado.ts';

export interface EstadoOcupacion {
  readonly ocupado: boolean;
  readonly error: string | null;
}

export interface GestionOcupacion<T> {
  readonly editar: (datos: T) => EstadoOcupacion;
  readonly flush: () => Promise<EstadoOcupacion>;
  readonly restablecer: () => EstadoOcupacion;
  readonly cancelar: () => EstadoOcupacion;
  readonly estado: () => EstadoOcupacion;
  readonly alCambiar: (cb: (e: EstadoOcupacion) => void) => () => void;
}

/**
 * Crea la máquina de ocupación sobre crearLogicaGuardado.
 * @param ms - ventana de debounce (DEBOUNCE_MS = 500)
 * @param guardarFn - envío IPC real; si lanza, el fallo queda registrado
 */
export function crearOcupacionOnboarding<T>(
  ms: number,
  guardarFn: (datos: T) => Promise<void>,
): GestionOcupacion<T> {
  let ocupado = false;
  let error: string | null = null;
  const oyentes = new Set<(e: EstadoOcupacion) => void>();

  const notificar = (): EstadoOcupacion => {
    const e: EstadoOcupacion = { ocupado, error };
    for (const cb of oyentes) cb(e);
    return e;
  };

  const logica = crearLogicaGuardado<T>(ms, async (datos) => {
    ocupado = true; notificar();
    try {
      await guardarFn(datos);
      error = null;
    } catch (err) {
      error = String(err);
    } finally {
      ocupado = false; notificar();
    }
  });

  // REQ-33-01: editar solo acumula en el debounce; jamás activa ocupación.
  function editar(datos: T): EstadoOcupacion {
    if (!ocupado) ocupado = false;
    logica.guardarConDebounce(datos);
    return notificar();
  }

  // REQ-33-04: flush restablece SIEMPRE en finally, incluso sin pendiente.
  async function flush(): Promise<EstadoOcupacion> {
    try {
      await logica.flushGuardado();
    } finally {
      ocupado = false;
    }
    return notificar();
  }

  function restablecer(): EstadoOcupacion {
    ocupado = false;
    return notificar();
  }

  function cancelar(): EstadoOcupacion {
    logica.cancelarGuardado();
    return restablecer();
  }

  return {
    editar, flush, restablecer, cancelar,
    estado: () => ({ ocupado, error }),
    alCambiar: (cb) => { oyentes.add(cb); return () => { oyentes.delete(cb); }; },
  };
}
