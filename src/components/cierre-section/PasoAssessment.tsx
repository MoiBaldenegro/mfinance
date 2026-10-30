// Paso 3 del wizard (REQ-16-04/06): assessment con las recomendaciones
// del backend priorizadas, encabezadas por los riesgos rojos.
import type { Recomendacion } from '../../domain/entities/cierre.ts';
import { ListaConsejos } from './ListaConsejos.tsx';

interface Props {
  readonly consejos: readonly Recomendacion[];
}

/** Lista priorizada de recomendaciones para decidir el próximo mes. */
export function PasoAssessment({ consejos }: Props) {
  return (
    <div className="paso-cierre">
      <h3 className="paso-cierre__titulo">Evaluación de tus finanzas</h3>
      <p className="card__descripcion">
        Reglas evaluadas sobre tus indicadores: los riesgos rojos van
        primero y son prioritarios.
      </p>
      <ListaConsejos consejos={consejos} />
    </div>
  );
}
