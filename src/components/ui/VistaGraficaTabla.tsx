// Tarjeta con una gráfica y su tabla de detalle alternables (segmentado):
// el usuario ve una u otra en lugar de ambas apiladas.
import { useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
  readonly titulo: string;
  readonly grafica: ReactNode;
  readonly tabla: ReactNode;
  /** Controles extra en la cabecera (a la izquierda del conmutador). */
  readonly acciones?: ReactNode;
}

export function VistaGraficaTabla({ titulo, grafica, tabla, acciones }: Props) {
  const [vista, setVista] = useState<'grafica' | 'tabla'>('grafica');
  return (
    <section className="card" aria-label={titulo}>
      <div className="card__cabecera">
        <h2 className="card__titulo">{titulo}</h2>
        <div className="pagina__acciones">
          {acciones}
          <div className="segmentado" role="radiogroup" aria-label={`Vista de ${titulo}`}>
            {(['grafica', 'tabla'] as const).map((v) => (
              <button key={v} type="button" role="radio" aria-checked={vista === v}
                className="segmentado__opcion" onClick={() => setVista(v)}>
                {v === 'grafica' ? 'Gráfica' : 'Tabla'}
              </button>
            ))}
          </div>
        </div>
      </div>
      {vista === 'grafica' ? grafica : tabla}
    </section>
  );
}
