// REQ-06-01: selector de mes del formulario Registro: input nativo
// type=month más botones ‹ › calculados por el caso de uso de dominio.
import { mesAnterior, mesSiguiente } from '../../domain/use-cases/navegacion-meses.ts';
import '../../styles/month-selector.css';

interface Props {
  /** Mes activo en formato YYYY-MM. */
  readonly mes: string;
  /** Avisa con el nuevo mes elegido (flechas o campo nativo). */
  readonly alCambiar: (mes: string) => void;
}

/** Selector de mes con navegación anterior/siguiente en español. */
export function MonthSelector({ mes, alCambiar }: Props) {
  return (
    <div className="month-selector">
      <button
        type="button"
        className="month-selector__flecha"
        aria-label="Mes anterior"
        onClick={() => alCambiar(mesAnterior(mes))}
      >
        ‹
      </button>
      <input
        type="month"
        className="month-selector__campo"
        aria-label="Mes del registro"
        value={mes}
        onChange={(evento) => {
          const valor = evento.target.value;
          if (valor !== '') alCambiar(valor);
        }}
      />
      <button
        type="button"
        className="month-selector__flecha"
        aria-label="Mes siguiente"
        onClick={() => alCambiar(mesSiguiente(mes))}
      >
        ›
      </button>
    </div>
  );
}
