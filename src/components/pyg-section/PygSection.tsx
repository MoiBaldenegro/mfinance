// REQ-07: sección P&G real: tabla mes a mes más gráfica Chart.js con la
// serie calculada en el backend, refresco al cambiar el snapshot
// (REQ-07-05) y estado vacío en español (REQ-07-06).
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import {
  filasDeTabla,
  MENSAJE_SIN_REGISTROS,
  serieVacia,
} from '../../domain/use-cases/pyg-tabla.ts';
import { PygChart } from './PygChart.tsx';
import { TablaPyg } from './TablaPyg.tsx';
import { usePygSerie } from './use-pyg-serie.ts';
import { ProyeccionSection } from '../pyg-proyeccion-section/ProyeccionSection.tsx';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/pyg-section.css';

interface Props {
  readonly snapshot: FinanceSnapshot;
}

/** Cuerpo de la sección según el desenlace del cálculo de la serie. */
function cuerpo(
  estado: ReturnType<typeof usePygSerie>,
  moneda: ReturnType<typeof usarMoneda>,
) {
  if (estado.nombre === 'calculando') {
    return (
      <p className="pyg-section__aviso estado-carga">
        Calculando la serie mensual…
      </p>
    );
  }
  if (estado.nombre === 'error') {
    return (
      <p className="pyg-section__aviso" role="alert">
        No se pudo calcular la serie mensual: {estado.motivo}
      </p>
    );
  }
  if (serieVacia(estado.serie)) {
    return <p className="pyg-section__aviso estado-vacio">{MENSAJE_SIN_REGISTROS}</p>;
  }
  const filas = filasDeTabla(estado.serie, moneda);
  return (
    <div className="pyg-section__paneles">
      <section className="pyg-section__tarjeta" aria-label="Tabla P&G">
        <h3 className="pyg-section__subtitulo">Detalle mensual</h3>
        <TablaPyg filas={filas} />
      </section>
      <section className="pyg-section__tarjeta" aria-label="Gráfica P&G">
        <h3 className="pyg-section__subtitulo">
          Ingresos, gastos y ahorro acumulado
        </h3>
        <PygChart serie={estado.serie} />
      </section>
    </div>
  );
}

/** Sección PyG con la serie automática calculada por el backend. */
export function PygSection({ snapshot }: Props) {
  const estado = usePygSerie(snapshot);
  const moneda = usarMoneda();
  return (
    <section className="pyg-section">
      <h2 className="pyg-section__titulo">PyG</h2>
      <p className="pyg-section__ayuda">
        Tu cuenta de resultados mes a mes, calculada automáticamente a partir
        de tus registros.
      </p>
      {cuerpo(estado, moneda)}
      {/* REQ-14: proyección editable reutilizando el motor de P&G. */}
      <ProyeccionSection snapshot={snapshot} />
    </section>
  );
}
