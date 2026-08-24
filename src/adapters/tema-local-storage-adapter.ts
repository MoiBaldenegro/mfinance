// Adapter localStorage del puerto TemaPort (REQ-17-07). Es el ÚNICO módulo
// que toca el almacenamiento del navegador para la preferencia de tema.
// Si el storage no está disponible (permisos, cuota), degrada en silencio:
// la preferencia simplemente no persiste y el default oscuro gobierna.
import type { Tema } from '../domain/entities/tema.ts';
import type { TemaPort } from '../domain/ports/tema-port.ts';

const CLAVE = 'mfinance.tema';

class TemaLocalStorageAdapter implements TemaPort {
  leer(): string | null {
    try {
      return window.localStorage.getItem(CLAVE);
    } catch {
      return null;
    }
  }

  guardar(tema: Tema): void {
    try {
      window.localStorage.setItem(CLAVE, tema);
    } catch {
      // Sin almacenamiento disponible: no persiste esta sesión.
    }
  }
}

/** Instancia única del puerto de tema para toda la app. */
export const temaPort: TemaPort = new TemaLocalStorageAdapter();
