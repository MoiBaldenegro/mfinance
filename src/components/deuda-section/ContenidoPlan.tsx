// Contenido del plan de deuda según el estado del cálculo.
import { navegarA } from '../../lib/bus-ui.ts';
import {
  filasDeTablaProyeccion,
  metricasDePlan,
  proyeccionVacia,
} from '../../domain/use-cases/deuda-tabla.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { DeudaChart } from './DeudaChart.tsx';
import { ListaDeudas } from './ListaDeudas.tsx';
import { MetricasPlan } from './MetricasPlan.tsx';
import { PanelEstrategia } from './PanelEstrategia.tsx';
import { VistaGraficaTabla } from '../ui/VistaGraficaTabla.tsx';
import { TablaProyeccion } from './TablaProyeccion.tsx';
import type { EstadoPlanDeuda } from './use-plan-deuda.ts';
import type { useEstrategiaDeuda } from './use-estrategia-deuda.ts';

interface Props {
  readonly estado: EstadoPlanDeuda;
  readonly control: ReturnType<typeof useEstrategiaDeuda>;
}

export function ContenidoPlan({ estado, control }: Props) {
  const moneda = usarMoneda();
  if (estado.nombre === 'calculando') {
    return <p className="estado-carga">Calculando el plan de deuda…</p>;
  }
  if (estado.nombre === 'error') {
    return <p className="aviso aviso--error" role="alert">No se pudo calcular el plan de deuda: {estado.motivo}</p>;
  }
  const { proyeccion, deuda_objetivo, orden_avalancha, orden_bola_nieve } = estado.plan;
  if (proyeccionVacia(proyeccion)) {
    return (
      <div className="estado-vacio deuda-section__vacio">
        <p><strong>No tienes deudas registradas.</strong></p>
        <p>Cuando añadas un pasivo en Balance, aquí verás tu plan para liquidarlo.</p>
        <button type="button" className="btn btn--sm" onClick={() => navegarA('balance')}>Ir a Balance</button>
      </div>
    );
  }
  const deudas = control.estrategia === 'Avalanche' ? orden_avalancha : orden_bola_nieve;
  return (
    <>
      <MetricasPlan metricas={metricasDePlan(proyeccion, moneda)} />
      <div className="rejilla deuda-section__fila">
        <PanelEstrategia control={control} />
        <ListaDeudas deudas={deudas} deudaObjetivo={deuda_objetivo} estrategia={control.estrategia} />
      </div>
      <VistaGraficaTabla titulo="Pagos y saldo restante" grafica={<DeudaChart proyeccion={proyeccion} />}
        tabla={<TablaProyeccion filas={filasDeTablaProyeccion(proyeccion, moneda)} />} />
    </>
  );
}
