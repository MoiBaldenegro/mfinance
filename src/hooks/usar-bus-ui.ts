// REQ-27-07/08: suscripción de la shell al bus de eventos UI. Devuelve
// el mensaje de toast vigente (auto-cierre a los 4 s) y aplica la
// navegación pedida por cualquier parte de la app vía callback.
import { useEffect, useState } from 'react';
import { alNavegar, alToast } from '../lib/bus-ui.ts';

const DURACION_TOAST_MS = 4000;

/**
 * Puente shell ↔ bus-ui: navega a la sección pedida con `navegarA` y
 * expone el último toast publicado con `mostrarToast`.
 */
export function usarBusUi(onNavegar: (seccion: string) => void): string | null {
  const [mensaje, setMensaje] = useState<string | null>(null);
  useEffect(() => {
    const bajaNavegacion = alNavegar((seccion) => onNavegar(seccion));
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const bajaToast = alToast((nuevo) => {
      setMensaje(nuevo);
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(() => setMensaje(null), DURACION_TOAST_MS);
    });
    return () => {
      bajaNavegacion();
      bajaToast();
      if (temporizador) clearTimeout(temporizador);
    };
  }, [onNavegar]);
  return mensaje;
}
