// Lógica de guardado con debounce para integración en hook React (REQ-25-06)
// Extraída a dominio para pureza y testabilidad

export interface LogicaGuardado<T> {
  readonly guardarConDebounce: (datos: T) => void;
  readonly flushGuardado: () => Promise<void>;
  readonly cancelarGuardado: () => void;
}

/**
 * Crea lógica de guardado con debounce para usar en hook React.
 * @param ms - milisegundos de debounce
 * @param guardarFn - función async que recibe los datos y los guarda
 * @returns objeto con guardarConDebounce, flushGuardado, cancelarGuardado
 */
export function crearLogicaGuardado<T>(
  ms: number,
  guardarFn: (datos: T) => Promise<void>,
): LogicaGuardado<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendiente: T | null = null;
  let flushPromise: Promise<void> | null = null;
  let flushResolve: (() => void) | null = null;

  function guardarConDebounce(datos: T): void {
    pendiente = datos;
    if (timeoutId) clearTimeout(timeoutId);
    flushPromise = new Promise<void>((resolve) => { flushResolve = resolve; });
    timeoutId = setTimeout(async () => {
      const datosAGuardar = pendiente; pendiente = null;
      if (datosAGuardar !== null) { try { await guardarFn(datosAGuardar); } finally { flushResolve?.(); flushResolve = flushPromise = null; } }
    }, ms);
  }

  async function flushGuardado(): Promise<void> {
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; const datosAGuardar = pendiente; pendiente = null; if (datosAGuardar !== null) { try { await guardarFn(datosAGuardar); } finally { flushResolve?.(); flushResolve = flushPromise = null; } } }
    else if (flushPromise) await flushPromise;
  }

  function cancelarGuardado(): void {
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; pendiente = null; flushResolve?.(); flushResolve = flushPromise = null; }
  }

  return { guardarConDebounce, flushGuardado, cancelarGuardado };
}