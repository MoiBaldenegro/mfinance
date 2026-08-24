// REQ-27-07/08: bus de eventos UI para acciones transversales de la
// shell (navegación programática a una sección y avisos tipo toast).
// Módulo puro bajo src/lib — mismo patrón que estado-tema: sin React
// ni @tauri-apps/api; la shell se suscribe y reacciona.

/** Suscriptor de navegación. */
type OyenteNavegacion = (seccion: string) => void;
/** Suscriptor de toasts. */
type OyenteToast = (mensaje: string) => void;

const oyentesNavegacion = new Set<OyenteNavegacion>();
const oyentesToast = new Set<OyenteToast>();

/**
 * Pide a la shell navegar a la sección indicada (p. ej. «registro»
 * tras completar o saltar el onboarding). Devuelve la función de baja.
 */
export function alNavegar(oyente: OyenteNavegacion): () => void {
  oyentesNavegacion.add(oyente);
  return () => { oyentesNavegacion.delete(oyente); };
}

/** Publica la intención de navegar; sin oyentes no hace nada. */
export function navegarA(seccion: string): void {
  for (const oyente of [...oyentesNavegacion]) oyente(seccion);
}

/** Suscribe un visor de toasts. Devuelve la función de baja. */
export function alToast(oyente: OyenteToast): () => void {
  oyentesToast.add(oyente);
  return () => { oyentesToast.delete(oyente); };
}

/** Muestra un toast efímero con el mensaje dado en toda la app. */
export function mostrarToast(mensaje: string): void {
  for (const oyente of [...oyentesToast]) oyente(mensaje);
}
