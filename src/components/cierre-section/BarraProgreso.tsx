// Barra de progreso del wizard de cierre (REQ-16-01): elemento nativo
// <progress> con el porcentaje completado más los rótulos de los cuatro
// pasos del ritual. Sin estilos inline: la hoja vive en src/styles/.
import { ETIQUETAS_PASOS, progresoWizard } from '../../domain/use-cases/wizard-cierre.ts';
import '../../styles/wizard-cierre.css';

interface Props {
  readonly paso: number;
}

/** Barra horizontal con el avance del ritual de cierre. */
export function BarraProgreso({ paso }: Props) {
  const progreso = progresoWizard(paso);
  return (
    <div className="cierre-wizard__progreso">
      <progress
        className="cierre-wizard__barra"
        value={progreso}
        max={100}
        aria-label={`Progreso del cierre: paso ${paso + 1} de ${ETIQUETAS_PASOS.length}`}
      />
      <ol className="cierre-wizard__pasos">
        {ETIQUETAS_PASOS.map((etiqueta, indice) => (
          <li
            key={etiqueta}
            className={
              indice === paso
                ? 'cierre-wizard__paso cierre-wizard__paso--activo'
                : 'cierre-wizard__paso'
            }
          >
            {etiqueta}
          </li>
        ))}
      </ol>
    </div>
  );
}
