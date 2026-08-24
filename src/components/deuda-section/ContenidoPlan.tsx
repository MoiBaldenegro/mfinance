// Contenido principal del plan de deuda según estado.
import { Fragment } from 'react';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import type { DebtStrategy } from '../../domain/entities/catalogs.ts';
import {
  filasDeTablaProyeccion,
  metricasDePlan,
  proyeccionVacia,
  MENSAJE_SIN_DEUDAS,
} from '../../domain/use-cases/deuda-tabla.ts';
import type { EstadoPlanDeuda } from './use-plan-deuda.ts';
import { DeudaChart } from './DeudaChart.tsx';
import { PanelEstrategia } from './PanelEstrategia.tsx';
import { ListaDeudas } from './ListaDeudas.tsx';
import { MetricasPlan } from './MetricasPlan.tsx';
import { TablaProyeccion } from './TablaProyeccion.tsx';
import '../../styles/deuda-section.css';

interface Props {
  readonly estado: EstadoPlanDeuda;
  readonly estrategia: DebtStrategy;
  readonly extra: number;
  readonly onCambioEstrategia: (nueva: DebtStrategy) => void;
  readonly onCambioExtra: (nuevo: number) => void;
}

export function ContenidoPlan({
  estado,
  estrategia,
  extra,
  onCambioEstrategia,
  onCambioExtra,
}: Props) {
  const moneda = usarMoneda();
  if (estado.nombre === 'calculando') {
    return <p className="deuda-section__aviso">Calculando el plan de deuda…</p>;
  }
  if (estado.nombre === 'error') {
    return (
      <p className="deuda-section__aviso" role="alert">
        No se pudo calcular el plan de deuda: {estado.motivo}
      </p>
    );
  }

  const { plan } = estado;
  const { proyeccion, deuda_objetivo, orden_avalancha, orden_bola_nieve } = plan;
  const deudasOrdenadas = estrategia === 'Avalanche' ? orden_avalancha : orden_bola_nieve;

  if (proyeccionVacia(proyeccion)) {
    return <p className="deuda-section__aviso">{MENSAJE_SIN_DEUDAS}</p>;
  }

  const filas = filasDeTablaProyeccion(proyeccion, moneda);
  const metricas = metricasDePlan(proyeccion, moneda);

  return (
    <Fragment>
      <PanelEstrategia
        estrategia={estrategia}
        extra={extra}
        onCambioEstrategia={onCambioEstrategia}
        onCambioExtra={onCambioExtra}
      />
      <ListaDeudas
        deudas={deudasOrdenadas}
        deudaObjetivo={deuda_objetivo}
        estrategia={estrategia}
      />
      <MetricasPlan metricas={metricas} />
      <TablaProyeccion filas={filas} />
      <section className="deuda-section__tarjeta" aria-label="Gráfica de proyección">
        <h3 className="deuda-section__subtitulo">Evolución: pagos y saldo restante</h3>
        <DeudaChart proyeccion={proyeccion} />
      </section>
    </Fragment>
  );
}