import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { Perfil } from '../../domain/entities/perfil.ts';
import { enfocarPrimario, mantenerFoco } from './foco-dialogo.ts';
import type { DocumentoFoco } from './foco-dialogo.ts';
import { Icono } from '../shell/Icono.tsx';
import '../../styles/perfil-carga-error-dialog.css';

interface Props {
  readonly perfilObjetivo: Perfil;
  readonly motivo: string;
  readonly alVolverPerfilAnterior: () => void;
  readonly alCerrar: () => void;
}

export function PerfilCargaErrorDialog({ perfilObjetivo, motivo,
  alVolverPerfilAnterior, alCerrar }: Props) {
  const dialogo = useRef<HTMLDivElement>(null);
  const primario = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!primario.current) return;
    return enfocarPrimario(primario.current, document as unknown as DocumentoFoco);
  }, []);
  const alTecla = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key === 'Escape') { evento.preventDefault(); alCerrar(); return; }
    const botones = dialogo.current?.querySelectorAll<HTMLButtonElement>('button');
    mantenerFoco(evento, botones ? Array.from(botones) : [], document as unknown as DocumentoFoco, alCerrar);
  };
  return <div className="perfil-carga-error-dialog" role="dialog" aria-modal="true"
    aria-labelledby="perfil-carga-error-titulo" aria-describedby="perfil-carga-error-descripcion"
    ref={dialogo} onKeyDown={alTecla}>
    <div className="perfil-carga-error-dialog__superficie">
      <h1 id="perfil-carga-error-titulo" className="perfil-carga-error-dialog__titulo" tabIndex={-1}>No se pudo cargar el perfil</h1>
      <div id="perfil-carga-error-descripcion" className="perfil-carga-error-dialog__descripcion">
        <p>El perfil afectado es <strong>{perfilObjetivo.nombre}</strong>.</p>
        <p className="perfil-carga-error-dialog__motivo">{motivo}</p>
      </div>
      <button ref={primario} type="button" autoFocus onClick={alVolverPerfilAnterior}
        className="btn btn--primario perfil-carga-error-dialog__volver"
        aria-label="Volver al perfil anterior">Volver al perfil anterior</button>
      <button type="button" onClick={alCerrar} aria-label="Cerrar diálogo" title="Cerrar"
        className="btn btn--fantasma btn--icono perfil-carga-error-dialog__cerrar"><Icono nombre="cerrar" /></button>
      <button type="button" onClick={alCerrar}
        className="btn perfil-carga-error-dialog__cancelar">Cancelar</button>
    </div>
  </div>;
}
