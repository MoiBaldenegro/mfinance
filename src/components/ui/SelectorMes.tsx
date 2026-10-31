// Selector de mes compartido: flechas anterior/siguiente alrededor de un
// input nativo type=month. La aritmética de meses vive en el dominio.
import { mesAnterior, mesSiguiente } from '../../domain/use-cases/navegacion-meses.ts';
import { Icono } from '../shell/Icono';
import '../../styles/selector-mes.css';

interface Props {
  /** Mes activo en formato YYYY-MM. */
  readonly mes: string;
  /** Avisa con el nuevo mes elegido (flechas o campo nativo). */
  readonly alCambiar: (mes: string) => void;
  /** Nombre accesible del campo. */
  readonly etiqueta?: string;
}

/** Selector de mes con navegación anterior/siguiente. */
export function SelectorMes({ mes, alCambiar, etiqueta = 'Mes' }: Props) {
  return (
    <div className="selector-mes">
      <button type="button" className="selector-mes__flecha" aria-label="Mes anterior"
        onClick={() => alCambiar(mesAnterior(mes))}>
        <Icono nombre="anterior" tamano={16} />
      </button>
      <input type="month" className="selector-mes__campo" aria-label={etiqueta} value={mes}
        onChange={(evento) => {
          const valor = evento.target.value;
          if (valor !== '') alCambiar(valor);
        }} />
      <button type="button" className="selector-mes__flecha" aria-label="Mes siguiente"
        onClick={() => alCambiar(mesSiguiente(mes))}>
        <Icono nombre="siguiente" tamano={16} />
      </button>
    </div>
  );
}
