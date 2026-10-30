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
import { CabeceraPagina } from '../ui/CabeceraPagina';
import { Pestanas } from '../ui/Pestanas.tsx';
import { VistaGraficaTabla } from '../ui/VistaGraficaTabla.tsx';
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
      <p className="estado-carga">
        Calculando la serie mensual…
      </p>
    );
  }
  if (estado.nombre === 'error') {
    return (
      <p className="aviso aviso--error" role="alert">
        No se pudo calcular la serie mensual: {estado.motivo}
      </p>
    );
  }
  if (serieVacia(estado.serie)) {
    return <p className="estado-vacio">{MENSAJE_SIN_REGISTROS}</p>;
  }
  const filas = filasDeTabla(estado.serie, moneda);
  return (
    <VistaGraficaTabla titulo="Ingresos, gastos y ahorro acumulado"
      grafica={<PygChart serie={estado.serie} />} tabla={<TablaPyg filas={filas} />} />
  );
}

/** Sección PyG con la serie automática calculada por el backend. */
export function PygSection({ snapshot }: Props) {
  const estado = usePygSerie(snapshot);
  const moneda = usarMoneda();
  return (
    <section className="pagina pyg-section">
      <CabeceraPagina titulo="Pérdidas y ganancias"
        descripcion="Tu cuenta de resultados mes a mes, calculada a partir de tus registros." />
      <Pestanas id="pyg" etiqueta="Vistas de PyG" pestanas={[
        { id: 'historico', titulo: 'Histórico', contenido: cuerpo(estado, moneda) },
        // REQ-14: proyección editable reutilizando el motor de P&G.
        { id: 'proyeccion', titulo: 'Proyección 12 meses', contenido: <ProyeccionSection snapshot={snapshot} /> },
      ]} />
    </section>
  );
}
