// REQ-08-04: tarjetas resumen Total Activos | Total Pasivos | Patrimonio
// con signo correcto y formato es-ES euros.
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import type { TotalesBalance } from '../../domain/entities/balance-serie.ts';
import '../../styles/balance-cards.css';

interface Props {
  readonly totales: TotalesBalance | null;
}

export function BalanceCards({ totales }: Props) {
  const moneda = usarMoneda();
  if (!totales) return null;

  return (
    <div className="balance-cards">
      <div className="balance-card balance-card--activos">
        <span className="balance-card__label">Total Activos</span>
        <strong className="balance-card__value balance-card__value--positive">
          {formatoMoneda(totales.activos, moneda)}
        </strong>
      </div>
      <div className="balance-card balance-card--pasivos">
        <span className="balance-card__label">Total Pasivos</span>
        <strong className="balance-card__value balance-card__value--negative">
          {formatoMoneda(totales.pasivos, moneda)}
        </strong>
      </div>
      <div className="balance-card balance-card--patrimonio">
        <span className="balance-card__label">Patrimonio</span>
        <strong className={
          totales.patrimonio >= 0
            ? 'balance-card__value balance-card__value--positive'
            : 'balance-card__value balance-card__value--negative'
        }>
          {formatoMoneda(totales.patrimonio, moneda)}
        </strong>
      </div>
    </div>
  );
}