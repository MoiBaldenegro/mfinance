// Panel independiente de consejos (REQ-16-04/05): recomendaciones
// vigentes recalculadas por el backend cuando cambian los datos cargados.
import { useEffect, useState } from 'react';
import type { Recomendacion } from '../../domain/entities/cierre.ts';
import {
  cargarConsejos,
  claseSeveridad,
  visibles,
  CONSEJOS_INICIALES,
} from '../../domain/use-cases/consejos-logic.ts';
import { cierrePort } from '../../adapters/cierre-ipc-adapter.ts';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';
import '../../styles/consejos-panel.css';
import '../../styles/consejo-item.css';

/** Lista priorizada de consejos siempre visible en la sección Cierre. */
export function ConsejosPanel() {
  const { estado } = useSnapshot();
  const [consejos, setConsejos] =
    useState<readonly Recomendacion[]>(CONSEJOS_INICIALES);
  const [motivo, setMotivo] = useState<string | null>(null);

  // REQ-16-05: se recalculan al cambiar los datos cargados (snapshot).
  useEffect(() => {
    let vigente = true;
    setMotivo(null);
    cargarConsejos(cierrePort)
      .then((vigentes) => { if (vigente) setConsejos(vigentes); })
      .catch((error: unknown) => {
        if (vigente) setMotivo((error as Error).message);
      });
    return () => { vigente = false; };
  }, [estado]);

  return (
    <section className="consejos-panel">
      <h3 className="consejos-panel__titulo">Consejos</h3>
      <p className="consejos-panel__ayuda">
        Recomendaciones vigentes según tus indicadores; los riesgos rojos
        encabezan la lista.
      </p>
      {motivo ? <p className="consejos-panel__error" role="alert">{motivo}</p> : null}
      {!motivo && consejos.length === 0 ? (
        <p className="consejos-panel__vacio">
          Sin recomendaciones todavía: registra tu actividad para evaluarlas.
        </p>
      ) : null}
      <ul className="consejos-panel__lista">
        {visibles(consejos).map((consejo) => (
          <li key={consejo.titulo} className={`consejo consejo--${claseSeveridad(consejo.severidad)}`}>
            <strong className="consejo__titulo">
              {consejo.severidad === 'rojo' ? 'Prioritario: ' : ''}
              {consejo.titulo}
            </strong>
            <span className="consejo__texto">{consejo.texto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
