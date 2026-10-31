// Lista de recomendaciones priorizada (rojos primero), compartida por el
// panel de consejos y el paso de assessment del asistente.
import type { Recomendacion } from '../../domain/entities/cierre.ts';
import { claseSeveridad, visibles } from '../../domain/use-cases/consejos-logic.ts';
import '../../styles/consejos.css';

interface Props {
  readonly consejos: readonly Recomendacion[];
}

export function ListaConsejos({ consejos }: Props) {
  return (
    <ul className="consejos">
      {visibles(consejos).map((consejo) => (
        <li key={consejo.titulo} className={`consejo consejo--${claseSeveridad(consejo.severidad)}`}>
          <strong className="consejo__titulo">
            {consejo.severidad === 'rojo' ? <span className="badge badge--negativo">Prioritario</span> : null}
            {consejo.titulo}
          </strong>
          <span className="consejo__texto">{consejo.texto}</span>
        </li>
      ))}
    </ul>
  );
}
