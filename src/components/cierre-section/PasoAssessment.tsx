// Paso 3 del wizard (REQ-16-04/06): assessment con las recomendaciones
// del backend priorizadas, encabezadas por los riesgos rojos.
import { claseSeveridad, visibles } from '../../domain/use-cases/consejos-logic.ts';
import type { Recomendacion } from '../../domain/entities/cierre.ts';
import '../../styles/pasos-wizard.css';
import '../../styles/consejo-item.css';

interface Props {
  readonly consejos: readonly Recomendacion[];
}

/** Lista priorizada de recomendaciones para decidir el próximo mes. */
export function PasoAssessment({ consejos }: Props) {
  return (
    <div className="paso-assessment">
      <h3 className="paso-assessment__titulo">Assessment de tus finanzas</h3>
      <p className="paso-assessment__ayuda">
        Reglas evaluadas sobre tus indicadores: los riesgos rojos van
        primero y son prioritarios.
      </p>
      <ul className="paso-assessment__lista">
        {visibles(consejos).map((consejo) => (
          <li
            key={consejo.titulo}
            className={`consejo consejo--${claseSeveridad(consejo.severidad)}`}
          >
            <strong className="consejo__titulo">
              {consejo.severidad === 'rojo' ? 'Prioritario: ' : ''}
              {consejo.titulo}
            </strong>
            <span className="consejo__texto">{consejo.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
