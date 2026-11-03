// Caso de uso de UI para el ciclo de actualización: la app comprueba sola
// al arrancar, avisa si hay versión nueva y permite descargar, instalar y
// reiniciar. Toda la dependencia de Tauri queda en el adapter.
import { useCallback, useEffect, useState } from 'react';
import { usarPuertos } from '../app/puertos.ts';
import type {
  ActualizacionDisponible,
  ProgresoActualizacion,
} from '../domain/ports/actualizador-port.ts';

export type EstadoActualizaciones =
  | { readonly nombre: 'inactivo' }
  | { readonly nombre: 'disponible'; readonly actualizacion: ActualizacionDisponible }
  | {
      readonly nombre: 'descargando';
      readonly actualizacion: ActualizacionDisponible;
      readonly progreso: ProgresoActualizacion;
    }
  | { readonly nombre: 'instalada' }
  | { readonly nombre: 'error'; readonly mensaje: string };

function mensajeDeError(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== '') return error.message;
  if (typeof error === 'string' && error.trim() !== '') return error;
  return 'No se pudo completar la operación de actualización.';
}

export function useActualizaciones() {
  const { actualizador } = usarPuertos();
  const [versionActual, setVersionActual] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoActualizaciones>({ nombre: 'inactivo' });
  const [descartada, setDescartada] = useState(false);

  useEffect(() => {
    let vigente = true;
    actualizador
      .versionActual()
      .then((version) => {
        if (vigente) setVersionActual(version);
      })
      .catch(() => {
        // Sin versión actual el aviso sigue siendo útil.
      });
    return () => {
      vigente = false;
    };
  }, [actualizador]);

  useEffect(() => {
    let vigente = true;
    // Comprobación automática al arrancar. Un fallo (sin red, endpoint aún
    // sin release) es silencioso: no debe interrumpir al usuario.
    actualizador
      .buscar()
      .then((actualizacion) => {
        if (vigente && actualizacion) {
          setEstado({ nombre: 'disponible', actualizacion });
        }
      })
      .catch(() => {
        // Silencioso a propósito.
      });
    return () => {
      vigente = false;
    };
  }, [actualizador]);

  const instalar = useCallback(async (): Promise<void> => {
    if (estado.nombre !== 'disponible') return;
    const actualizacion = estado.actualizacion;
    setEstado({
      nombre: 'descargando',
      actualizacion,
      progreso: { descargado: 0, total: null },
    });
    try {
      await actualizador.descargarEInstalar((progreso) => {
        setEstado((anterior) =>
          anterior.nombre === 'descargando' ? { ...anterior, progreso } : anterior,
        );
      });
      setEstado({ nombre: 'instalada' });
    } catch (error: unknown) {
      setEstado({ nombre: 'error', mensaje: mensajeDeError(error) });
    }
  }, [actualizador, estado]);

  const reiniciar = useCallback(async (): Promise<void> => {
    try {
      await actualizador.reiniciar();
    } catch (error: unknown) {
      setEstado({ nombre: 'error', mensaje: mensajeDeError(error) });
    }
  }, [actualizador]);

  /** El usuario prefiere actualizar en otro momento: oculta el aviso. */
  const aplazar = useCallback((): void => setDescartada(true), []);

  return {
    versionActual,
    estado,
    descartada,
    instalar,
    reiniciar,
    aplazar,
  };
}
