// Aviso global de actualizaciones: la app comprueba sola al arrancar y este
// diálogo aparece únicamente si hay una versión nueva o una instalación en
// curso. No conoce Tauri ni el endpoint; todo pasa por use-actualizaciones.
import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { mantenerFoco } from '../error-screen/foco-dialogo.ts';
import type { DocumentoFoco } from '../error-screen/foco-dialogo.ts';
import { useActualizaciones } from '../../hooks/use-actualizaciones.ts';
import '../../styles/actualizaciones-auto.css';

function formatearBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function porcentajeDescarga(descargado: number, total: number | null): number | null {
  if (!total || total <= 0) return null;
  return Math.round((descargado / total) * 100);
}

export function ActualizacionesAuto() {
  const { versionActual, estado, descartada, instalar, reiniciar, aplazar } = useActualizaciones();
  const dialogo = useRef<HTMLDivElement>(null);
  const foco = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (descartada || estado.nombre === 'inactivo') return;
    foco.current?.focus();
  }, [estado.nombre, descartada]);

  if (descartada || estado.nombre === 'inactivo') return null;

  const descargando = estado.nombre === 'descargando';
  const cerrar = () => { if (!descargando) aplazar(); };

  const alTecla = (evento: KeyboardEvent<HTMLDivElement>) => {
    const botones = dialogo.current?.querySelectorAll<HTMLButtonElement>('button');
    mantenerFoco(
      evento,
      botones ? Array.from(botones) : [],
      document as unknown as DocumentoFoco,
      cerrar,
    );
  };

  let titulo = 'Actualización disponible';
  let contenido;
  if (estado.nombre === 'disponible') {
    titulo = 'Nueva versión disponible';
    contenido = (
      <>
        <p>
          Ya está la versión <strong>{estado.actualizacion.version}</strong>
          {versionActual ? ` (tienes la ${versionActual})` : null}.
        </p>
        {estado.actualizacion.notas ? (
          <p className="actualizaciones-auto__notas">{estado.actualizacion.notas}</p>
        ) : null}
        <div className="actualizaciones-auto__acciones">
          <button type="button" className="btn btn--primario" onClick={() => void instalar()}>
            Actualizar ahora
          </button>
          <button type="button" className="btn" onClick={aplazar}>Más tarde</button>
        </div>
      </>
    );
  } else if (estado.nombre === 'descargando') {
    titulo = 'Descargando actualización';
    const { descargado, total } = estado.progreso;
    const porcentaje = porcentajeDescarga(descargado, total);
    contenido = (
      <>
        <p role="status">
          Instalando la versión {estado.actualizacion.version}
          {total ? `: ${formatearBytes(descargado)} de ${formatearBytes(total)}` : '…'}
        </p>
        <progress
          className="actualizaciones-auto__progreso"
          max={100}
          value={porcentaje ?? undefined}
          aria-label="Progreso de descarga"
        />
      </>
    );
  } else if (estado.nombre === 'instalada') {
    titulo = 'Actualización instalada';
    contenido = (
      <>
        <p>Reinicia mfinance para aplicar los cambios.</p>
        <div className="actualizaciones-auto__acciones">
          <button type="button" className="btn btn--primario" onClick={() => void reiniciar()}>
            Reiniciar ahora
          </button>
          <button type="button" className="btn" onClick={aplazar}>Más tarde</button>
        </div>
      </>
    );
  } else {
    titulo = 'No se pudo actualizar';
    contenido = (
      <>
        <p className="actualizaciones-auto__error" role="alert">{estado.mensaje}</p>
        <div className="actualizaciones-auto__acciones">
          <button type="button" className="btn btn--primario" onClick={aplazar}>Cerrar</button>
        </div>
      </>
    );
  }

  return (
    <div className="actualizaciones-auto" role="dialog" aria-modal="true"
      aria-labelledby="actualizaciones-auto-titulo" ref={dialogo} onKeyDown={alTecla}>
      <div className="actualizaciones-auto__superficie" ref={foco} tabIndex={-1}>
        <h2 id="actualizaciones-auto-titulo" className="actualizaciones-auto__titulo">{titulo}</h2>
        <div className="actualizaciones-auto__contenido">{contenido}</div>
      </div>
    </div>
  );
}
