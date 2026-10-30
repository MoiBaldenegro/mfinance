// KPIs del balance: total activos, total pasivos y patrimonio neto.
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import type { TotalesBalance } from '../../domain/entities/balance-serie.ts';

interface Props {
  readonly totales: TotalesBalance | null;
}

export function BalanceCards({ totales }: Props) {
  const moneda = usarMoneda();
  const valor = (n: number | undefined) => formatoMoneda(n ?? 0, moneda);
  const patrimonio = totales?.patrimonio ?? 0;
  return (
    <div className="rejilla rejilla--3">
      <div className="kpi">
        <span className="kpi__etiqueta">Total activos</span>
        <strong className="kpi__valor">{valor(totales?.activos)}</strong>
      </div>
      <div className="kpi">
        <span className="kpi__etiqueta">Total pasivos</span>
        <strong className="kpi__valor">{valor(totales?.pasivos)}</strong>
      </div>
      <div className="kpi">
        <span className="kpi__etiqueta">Patrimonio neto</span>
        <strong className={patrimonio < 0 ? 'kpi__valor negativo' : 'kpi__valor positivo'}>
          {valor(totales?.patrimonio)}
        </strong>
      </div>
    </div>
  );
}
