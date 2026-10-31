// Indicador de pasos del asistente de cierre: hechos, actual y pendientes.
import { ETIQUETAS_PASOS } from '../../domain/use-cases/wizard-cierre.ts';
import { Icono } from '../shell/Icono.tsx';

interface Props {
  readonly paso: number;
}

export function BarraProgreso({ paso }: Props) {
  return (
    <ol className="pasos-cierre" aria-label={`Paso ${paso + 1} de ${ETIQUETAS_PASOS.length}`}>
      {ETIQUETAS_PASOS.map((etiqueta, indice) => {
        const estado = indice < paso ? 'hecho' : indice === paso ? 'actual' : 'pendiente';
        return (
          <li key={etiqueta} className={`pasos-cierre__paso pasos-cierre__paso--${estado}`}
            aria-current={estado === 'actual' ? 'step' : undefined}>
            <span className="pasos-cierre__numero" aria-hidden="true">{estado === 'hecho' ? <Icono nombre="check" tamano={12} /> : indice + 1}</span>
            <span className="pasos-cierre__etiqueta">{etiqueta}</span>
          </li>
        );
      })}
    </ol>
  );
}
