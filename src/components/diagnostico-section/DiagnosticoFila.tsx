// Celdas y botones de la fila revisable (parte 2 de DiagnosticoTabla);
// comparte su hoja con la tabla (todo .tsx importa hoja desde src/styles).
import type { FilaTabla, CambiosFila } from '../../domain/use-cases/diagnostico-tabla.ts';
import type { PropsTabla } from './DiagnosticoTabla.tsx';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from '../../domain/entities/catalogs.ts';
import '../../styles/diagnostico-tabla.css';
type AccionesFila = Pick<PropsTabla, 'alEditar' | 'alConfirmar' | 'alDescartar' | 'alReabrir'>;

export function celdaFecha(fila: FilaTabla, editable: boolean, alEditar: PropsTabla['alEditar']) {
  return editable ? (
    <input
      className="diagnostico-tabla__campo"
      aria-label="Fecha del movimiento"
      value={fila.fecha}
      onChange={(e) => alEditar(fila.id, { fecha: e.target.value })}
    />
  ) : (
    fila.fecha
  );
}

export function concepto(fila: FilaTabla, editable: boolean, alEditar: PropsTabla['alEditar']) {
  return editable ? (
    <input
      className="diagnostico-tabla__campo diagnostico-tabla__campo--ancho"
      aria-label="Comercio del movimiento"
      value={fila.comercio}
      onChange={(e) => alEditar(fila.id, { comercio: e.target.value })}
    />
  ) : (
    fila.comercio
  );
}

export function importe(fila: FilaTabla, editable: boolean, alEditar: PropsTabla['alEditar']) {
  const alCambiar = (e: React.ChangeEvent<HTMLInputElement>) =>
    alEditar(fila.id, { importe: Number(e.target.value) } as CambiosFila);
  return editable ? (
    <input
      type="number"
      step="0.01"
      className="diagnostico-tabla__campo diagnostico-tabla__campo--importe"
      aria-label="Importe del movimiento"
      value={String(fila.importe)}
      onChange={alCambiar}
    />
  ) : (
    fila.importe.toFixed(2)
  );
}

export function categoria(fila: FilaTabla, editable: boolean, alEditar: PropsTabla['alEditar']) {
  return (
    <select
      className="diagnostico-tabla__campo"
      aria-label="Categoría del gasto"
      value={fila.categoria ?? ''}
      disabled={!editable}
      onChange={(e) => {
        const valor = e.target.value;
        alEditar(fila.id, {
          categoria: valor === '' ? null : (valor as NonNullable<FilaTabla['categoria']>),
        });
      }}
    >
      <option value="">Sin categoría</option>
      {EXPENSE_CATEGORIES.map((opcion) => (
        <option key={opcion} value={opcion}>
          {EXPENSE_CATEGORY_LABELS[opcion]}
        </option>
      ))}
    </select>
  );
}

export function botones(fila: FilaTabla, acciones: AccionesFila) {
  if (fila.estado !== 'pendiente') {
    return (
      <button type="button" className="diagnostico-tabla__boton"
        onClick={() => acciones.alReabrir(fila.id)}>
        Editar
      </button>
    );
  }
  const sinCategoria = fila.categoria === null;
  const titulo = sinCategoria ? 'Asigna una categoría antes de confirmar' : undefined;
  return (
    <>
      <button type="button" disabled={sinCategoria} title={titulo}
        className="diagnostico-tabla__boton diagnostico-tabla__boton--ok"
        onClick={() => acciones.alConfirmar(fila.id)}>
        Confirmar
      </button>
      <button type="button" className="diagnostico-tabla__boton diagnostico-tabla__boton--mal"
        onClick={() => acciones.alDescartar(fila.id)}>
        Descartar
      </button>
    </>
  );
}
