export interface ElementoFoco { focus: () => void }
export interface DocumentoFoco { readonly activeElement: ElementoFoco | null }
export interface EventoFoco {
  readonly key: string;
  readonly shiftKey: boolean;
  preventDefault: () => void;
}

export function enfocarPrimario(primario: ElementoFoco, documento: DocumentoFoco) {
  const anterior = documento.activeElement;
  primario.focus();
  return () => anterior?.focus();
}

export function mantenerFoco(evento: EventoFoco, elementos: readonly ElementoFoco[],
  documento: DocumentoFoco, cerrar: () => void) {
  if (evento.key === 'Escape') { evento.preventDefault(); cerrar(); return; }
  if (evento.key !== 'Tab' || elementos.length === 0) return;
  const primero = elementos[0]; const ultimo = elementos[elementos.length - 1];
  if (evento.shiftKey && documento.activeElement === primero) { evento.preventDefault(); ultimo.focus(); }
  if (!evento.shiftKey && documento.activeElement === ultimo) { evento.preventDefault(); primero.focus(); }
}
