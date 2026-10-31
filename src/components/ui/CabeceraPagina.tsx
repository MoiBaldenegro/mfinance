// Cabecera común de cada sección: título, descripción y acciones.
import type { ReactNode } from 'react';

interface Props {
  readonly titulo: string;
  readonly descripcion?: ReactNode;
  /** Controles alineados a la derecha (selector de mes, botones…). */
  readonly children?: ReactNode;
}

/** Título de página con descripción opcional y zona de acciones. */
export function CabeceraPagina({ titulo, descripcion, children }: Props) {
  return (
    <header className="pagina__cabecera">
      <div className="pagina__titulos">
        <h1 className="pagina__titulo">{titulo}</h1>
        {descripcion ? <p className="pagina__descripcion">{descripcion}</p> : null}
      </div>
      {children ? <div className="pagina__acciones">{children}</div> : null}
    </header>
  );
}
