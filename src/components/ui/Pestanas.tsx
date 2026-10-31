// Pestañas accesibles (patrón WAI-ARIA tabs): divide una sección larga en
// vistas para evitar el scroll. Flechas ←/→, Inicio y Fin mueven el foco.
// Cada panel se monta la primera vez que se visita y después solo se oculta,
// así no pierde su estado (borradores, scroll). La pestaña elegida se recuerda por
// `id` mientras dura la sesión, así volver a la sección no la reinicia.
import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface Pestana {
  readonly id: string;
  readonly titulo: string;
  /** Texto corto junto al título (contador, estado…). */
  readonly insignia?: string;
  readonly contenido: ReactNode;
}

interface Props {
  /** Clave estable para recordar la pestaña elegida. */
  readonly id: string;
  /** Nombre accesible de la lista de pestañas. */
  readonly etiqueta: string;
  readonly pestanas: readonly Pestana[];
}

const recordadas = new Map<string, string>();

export function Pestanas({ id, etiqueta, pestanas }: Props) {
  const base = useId();
  const botones = useRef<(HTMLButtonElement | null)[]>([]);
  const [activa, setActiva] = useState(() => {
    const previa = recordadas.get(id);
    return pestanas.some((p) => p.id === previa) ? previa! : pestanas[0]?.id;
  });
  const indice = Math.max(0, pestanas.findIndex((p) => p.id === activa));
  const [visitadas, setVisitadas] = useState<ReadonlySet<string>>(() => new Set([pestanas[indice]?.id]));
  const elegir = (i: number) => {
    const destino = pestanas[(i + pestanas.length) % pestanas.length];
    setActiva(destino.id); recordadas.set(id, destino.id);
    setVisitadas((v) => (v.has(destino.id) ? v : new Set(v).add(destino.id)));
    botones.current[(i + pestanas.length) % pestanas.length]?.focus();
  };
  const alTecla = (e: KeyboardEvent) => {
    const mapa: Record<string, number> = { ArrowRight: indice + 1, ArrowLeft: indice - 1, Home: 0, End: pestanas.length - 1 };
    if (e.key in mapa) { e.preventDefault(); elegir(mapa[e.key]); }
  };
  return (
    <div className="pestanas">
      <div className="pestanas__lista" role="tablist" aria-label={etiqueta} onKeyDown={alTecla}>
        {pestanas.map((p, i) => (
          <button key={p.id} ref={(el) => { botones.current[i] = el; }} type="button" role="tab"
            id={`${base}-tab-${p.id}`} aria-controls={`${base}-panel-${p.id}`}
            aria-selected={i === indice} tabIndex={i === indice ? 0 : -1}
            className="pestanas__tab" onClick={() => elegir(i)}>
            {p.titulo}
            {p.insignia ? <span className="pestanas__insignia">{p.insignia}</span> : null}
          </button>
        ))}
      </div>
      {pestanas.map((p, i) => (visitadas.has(p.id) || i === indice ? (
        <div key={p.id} role="tabpanel" id={`${base}-panel-${p.id}`} aria-labelledby={`${base}-tab-${p.id}`}
          className="pestanas__panel" tabIndex={0} hidden={i !== indice}>
          {p.contenido}
        </div>
      ) : null))}
    </div>
  );
}
