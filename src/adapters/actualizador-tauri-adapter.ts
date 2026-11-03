// Adapter Tauri del puerto ActualizadorPort. Es el ÚNICO módulo del
// frontend que importa el plugin updater y el plugin process; la UI y el
// dominio permanecen ajenos a Tauri.
import { getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, type Update } from '@tauri-apps/plugin-updater';
import type {
  ActualizacionDisponible,
  ActualizadorPort,
  ProgresoActualizacion,
} from '../domain/ports/actualizador-port.ts';

let pendiente: Update | null = null;

/** Cierra la actualización pendiente si el usuario vuelve a comprobar. */
async function descartarPendiente(): Promise<void> {
  if (!pendiente) return;
  const anterior = pendiente;
  pendiente = null;
  await anterior.close();
}

class ActualizadorTauriAdapter implements ActualizadorPort {
  versionActual(): Promise<string> {
    return getVersion();
  }

  async buscar(): Promise<ActualizacionDisponible | null> {
    await descartarPendiente();
    pendiente = await check();
    if (!pendiente) return null;
    return {
      version: pendiente.version,
      notas: pendiente.body ?? null,
      fecha: pendiente.date ?? null,
    };
  }

  async descargarEInstalar(
    alProgreso: (progreso: ProgresoActualizacion) => void,
  ): Promise<void> {
    if (!pendiente) throw new Error('No hay una actualización pendiente');
    let descargado = 0;
    let total: number | null = null;

    await pendiente.downloadAndInstall((evento) => {
      if (evento.event === 'Started') {
        total = evento.data.contentLength ?? null;
      } else if (evento.event === 'Progress') {
        descargado += evento.data.chunkLength;
      }
      alProgreso({ descargado, total });
    });

    pendiente = null;
  }

  async reiniciar(): Promise<void> {
    await relaunch();
  }
}

/** Instancia única del puerto de actualizaciones para toda la app. */
export const actualizadorPort: ActualizadorPort = new ActualizadorTauriAdapter();
