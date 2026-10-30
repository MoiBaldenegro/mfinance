// Panel independiente de consejos (REQ-16-04/05): recomendaciones
// vigentes recalculadas por el backend cuando cambian los datos cargados.
import { useEffect, useState } from 'react';
import type { Recomendacion } from '../../domain/entities/cierre.ts';
import {
  cargarConsejos,
  CONSEJOS_INICIALES,
} from '../../domain/use-cases/consejos-logic.ts';
import { usarPuertos } from '../../app/puertos.ts';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';
import { ListaConsejos } from './ListaConsejos.tsx';

/** Lista priorizada de consejos siempre visible en la sección Cierre. */
export function ConsejosPanel() {
  const { cierre: cierrePort } = usarPuertos();
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
    <section className="card consejos-panel" aria-label="Consejos">
      <h2 className="card__titulo">Consejos</h2>
      <p className="card__descripcion">Según tus indicadores actuales; lo prioritario, primero.</p>
      {motivo ? <p className="aviso aviso--error" role="alert">{motivo}</p> : null}
      {!motivo && consejos.length === 0 ? (
        <p className="card__descripcion">
          Sin recomendaciones todavía: registra tu actividad para evaluarlas.
        </p>
      ) : null}
      <ListaConsejos consejos={consejos} />
    </section>
  );
}
