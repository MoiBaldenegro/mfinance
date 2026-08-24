// Lógica pura de debounce para guardado de onboarding (REQ-25-06)
// Sin React, sin framework - solo TS puro testeable con node:test

export interface GuardadoConDebounce {
  readonly ejecutar: () => void;
  readonly flush: () => Promise<void>;
  readonly cancelar: () => void;
}

/**
 * Crea una función de guardado con debounce.
 * @param ms - milisegundos de debounce (default 500)
 * @param guardarFn - función async que realiza el guardado real
 * @returns objeto con ejecutar, flush y cancelar
 */
export function crearGuardadoConDebounce(
  ms: number = 500,
  guardarFn: () => Promise<void>,
): GuardadoConDebounce {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let flushPromise: Promise<void> | null = null;
  let flushResolve: (() => void) | null = null;

  function ejecutar(): void {
    if (timeoutId) clearTimeout(timeoutId);
    flushPromise = new Promise<void>((resolve) => { flushResolve = resolve; });
    timeoutId = setTimeout(async () => {
      try { await guardarFn(); } finally { flushResolve?.(); flushResolve = flushPromise = null; }
    }, ms);
  }

  async function flush(): Promise<void> {
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; try { await guardarFn(); } finally { flushResolve?.(); flushResolve = flushPromise = null; } }
    else if (flushPromise) await flushPromise;
  }

  function cancelar(): void {
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; flushResolve?.(); flushResolve = flushPromise = null; }
  }

  return { ejecutar, flush, cancelar };
}