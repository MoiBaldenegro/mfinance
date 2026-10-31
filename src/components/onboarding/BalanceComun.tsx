// Piezas compartidas por las tres secciones del Paso 2 (activos, pasivos,
// inversiones): cabecera <summary> del acordeón y lista de elementos con
// acciones de editar / eliminar.
import { Icono } from '../shell/Icono.tsx';
import '../../styles/onboarding-paso-balance.css';

interface ResumenProps {
  readonly titulo: string;
  readonly cantidad: string;
  readonly total?: string;
}

/** Cabecera del acordeón; debe ir como primer hijo de <details>. */
export function ResumenBalance({ titulo, cantidad, total }: ResumenProps) {
  return (
    <summary className="ob-balance__resumen">
      <span className="ob-balance__chevron" aria-hidden="true"><Icono nombre="abajo" tamano={16} /></span>
      <span className="ob-balance__titulo">{titulo}</span>
      <span className="badge">{cantidad}</span>
      {total ? <span className="ob-balance__total num">{total}</span> : null}
    </summary>
  );
}

export interface FilaBalance {
  readonly clave: string;
  readonly titulo: string;
  readonly detalle?: string;
  readonly valor?: string;
  readonly nota?: string;
}

interface ListaProps {
  readonly filas: readonly FilaBalance[];
  readonly vacio: string;
  readonly editando: string | null;
  readonly deshabilitado: boolean;
  readonly alEditar: (clave: string) => void;
  readonly alEliminar?: (clave: string) => void;
  /** Etiqueta del botón de editar cuando la fila no tiene valor aún. */
  readonly etiquetaAlta?: string;
}

/** Lista de elementos capturados con sus acciones. */
export function ListaBalance({ filas, vacio, editando, deshabilitado, alEditar, alEliminar, etiquetaAlta }: ListaProps) {
  if (filas.length === 0) return <p className="ob-balance__vacio">{vacio}</p>;
  return (
    <ul className="ob-balance__lista">
      {filas.map((f) => (
        <li key={f.clave} className={`ob-balance__fila ${editando === f.clave ? 'ob-balance__fila--editando' : ''}`}>
          <div className="ob-balance__info">
            <span className="ob-balance__nombre">{f.titulo}</span>
            {f.detalle ? <span className="ob-balance__detalle">{f.detalle}</span> : null}
          </div>
          <div className="ob-balance__importes">
            {f.valor ? <span className="ob-balance__valor num">{f.valor}</span> : null}
            {f.nota ? <span className="ob-balance__detalle num">{f.nota}</span> : null}
          </div>
          <div className="ob-balance__acciones">
            {!f.valor && etiquetaAlta ? (
              <button type="button" className="btn btn--sm" onClick={() => alEditar(f.clave)}
                disabled={deshabilitado}><Icono nombre="mas" tamano={14} /> {etiquetaAlta}</button>
            ) : (
              <button type="button" className="btn btn--fantasma btn--sm btn--icono" onClick={() => alEditar(f.clave)}
                disabled={deshabilitado} aria-label={`Editar ${f.titulo}`} title="Editar"><Icono nombre="editar" tamano={16} /></button>
            )}
            {alEliminar && f.valor ? (
              <button type="button" className="btn btn--fantasma btn--sm btn--icono ob-balance__eliminar"
                onClick={() => alEliminar(f.clave)} disabled={deshabilitado}
                aria-label={`Eliminar ${f.titulo}`} title="Eliminar"><Icono nombre="eliminar" tamano={16} /></button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
