// Sección Deuda: plan de pago (Avalancha / Bola de nieve) con pago extra,
// métricas, gráfica y proyección; debajo, el simulador de créditos.
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { CabeceraPagina } from '../ui/CabeceraPagina';
import { ContenidoPlan } from './ContenidoPlan.tsx';
import { SimuladorPanel } from './simulador/SimuladorPanel.tsx';
import { Pestanas } from '../ui/Pestanas.tsx';
import { useEstrategiaDeuda } from './use-estrategia-deuda.ts';
import { usePlanDeuda } from './use-plan-deuda.ts';
import '../../styles/deuda-section.css';

const DESCRIPCION =
  'Elige cómo atacar tus deudas, ajusta el pago extra mensual y mira cuándo quedarás libre.';

interface Props {
  readonly snapshot: FinanceSnapshot;
}

export function DeudaSection({ snapshot }: Props) {
  const plan = usePlanDeuda(snapshot);
  const estrategia = useEstrategiaDeuda(snapshot);
  return (
    <section className="pagina deuda-section">
      <CabeceraPagina titulo="Deuda" descripcion={DESCRIPCION} />
      {estrategia.error ? <p className="aviso aviso--error" role="alert">{estrategia.error}</p> : null}
      <Pestanas id="deuda" etiqueta="Vistas de deuda" pestanas={[
        { id: 'plan', titulo: 'Mi plan', contenido: <ContenidoPlan estado={plan} control={estrategia} /> },
        { id: 'simulador', titulo: 'Simulador de créditos', contenido: <SimuladorPanel /> },
      ]} />
    </section>
  );
}
