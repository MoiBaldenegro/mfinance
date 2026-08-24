// REQ-12-10/11: tabla revisable fila a fila — fecha, comercio, importe y
// categoría del catálogo cerrado; acciones confirmar/editar/descartar.
import type { CambiosFila, FilaTabla } from '../../domain/use-cases/diagnostico-tabla.ts';
import { celdaFecha, concepto, importe, categoria, botones } from './DiagnosticoFila.tsx';
import { simboloDe } from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/diagnostico-tabla.css';

export interface PropsTabla {
  readonly filas: readonly FilaTabla[];
  readonly resumen: {
    readonly pendientes: number;
    readonly confirmadas: number;
    readonly descartadas: number;
    readonly total: number;
  };
  readonly confirmando: boolean;
  readonly alEditar: (id: string, cambios: CambiosFila) => void;
  readonly alConfirmar: (id: string) => void;
  readonly alDescartar: (id: string) => void;
  readonly alReabrir: (id: string) => void;
  readonly alConfirmarSeleccion: () => void;
}

/** Tabla revisable del análisis del mes. */
export function DiagnosticoTabla(props: PropsTabla) {
  const { filas, resumen, confirmando, alConfirmarSeleccion } = props;
  const simbolo = simboloDe(usarMoneda());
  if (filas.length === 0) {
    return (
      <p className="estado-vacio">
        Sin movimientos para revisar: analiza los PDFs del mes.
      </p>
    );
  }
  return (
    <div className="diagnostico-tabla">
      <table className="diagnostico-tabla__tabla">
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Comercio</th>
            <th scope="col">Importe ({simbolo})</th>
            <th scope="col">Categoría</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr
              key={fila.id}
              className={`diagnostico-tabla__fila diagnostico-tabla__fila--${fila.estado}`}
            >
              <td>{celdaFecha(fila, fila.estado === 'pendiente', props.alEditar)}</td>
              <td>{concepto(fila, fila.estado === 'pendiente', props.alEditar)}</td>
              <td>{importe(fila, fila.estado === 'pendiente', props.alEditar)}</td>
              <td>{categoria(fila, fila.estado === 'pendiente', props.alEditar)}</td>
              <td className="diagnostico-tabla__acciones">{botones(fila, props)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="diagnostico-tabla__pie">
        <span className="diagnostico-tabla__conteo">
          {resumen.confirmadas} confirmadas · {resumen.descartadas} descartadas ·{' '}
          {resumen.pendientes} pendientes de {resumen.total}
        </span>
        <button
          type="button"
          className="diagnostico-tabla__confirmar-todo"
          onClick={alConfirmarSeleccion}
          disabled={confirmando || resumen.confirmadas === 0}
        >
          Confirmar selección
        </button>
      </div>
    </div>
  );
}
