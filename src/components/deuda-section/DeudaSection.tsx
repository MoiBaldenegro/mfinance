// REQ-09: sección Deuda real: lista de deudas ordenada según estrategia,
// deuda objetivo destacada, pago extra editable, proyección mes a mes en
// tabla + gráfica Chart.js, métricas de meses e intereses ahorrados.
import { useState } from 'react';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { DebtStrategy } from '../../domain/entities/catalogs.ts';
import { usePlanDeuda } from './use-plan-deuda.ts';
import { ContenidoPlan } from './ContenidoPlan.tsx';
import { SimuladorPanel } from './simulador/SimuladorPanel.tsx';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';
import '../../styles/deuda-section.css';

interface Props {
  readonly snapshot: FinanceSnapshot;
}

async function persistirCambio(
  snapshot: FinanceSnapshot,
  cambios: Partial<FinanceSnapshot['strategy']>,
): Promise<void> {
  const nuevoSnapshot = { ...snapshot, strategy: { ...snapshot.strategy, ...cambios } };
  await snapshotPort.save(nuevoSnapshot);
}

export function DeudaSection({ snapshot }: Props) {
  const [estrategia, setEstrategia] = useState<DebtStrategy>(snapshot.strategy.debt_strategy);
  const [extra, setExtra] = useState(snapshot.strategy.extra_monthly_payment);
  const estado = usePlanDeuda(snapshot);

  if (estrategia !== snapshot.strategy.debt_strategy) setEstrategia(snapshot.strategy.debt_strategy);
  if (extra !== snapshot.strategy.extra_monthly_payment) setExtra(snapshot.strategy.extra_monthly_payment);

  const handleCambioEstrategia = async (nueva: DebtStrategy) => {
    setEstrategia(nueva);
    await persistirCambio(snapshot, { debt_strategy: nueva });
  };

  const handleCambioExtra = async (nuevo: number) => {
    const valor = Math.max(0, nuevo);
    setExtra(valor);
    await persistirCambio(snapshot, { extra_monthly_payment: valor });
  };

  return (
    <section className="deuda-section">
      <h2 className="deuda-section__titulo">Deuda</h2>
      <p className="deuda-section__ayuda">
        Plan de pago con estrategia Avalancha o Bola de nieve. Elige tu estrategia,
        ajusta el pago extra mensual y ve la proyección hasta quedar libre de deuda.
      </p>
      <div className="deuda-section__paneles">
        <ContenidoPlan
          estado={estado}
          estrategia={estrategia}
          extra={extra}
          onCambioEstrategia={handleCambioEstrategia}
          onCambioExtra={handleCambioExtra}
        />
        <SimuladorPanel />
      </div>
    </section>
  );
}