// Panel de estrategia y pago extra para la sección Deuda.
import type { DebtStrategy } from '../../domain/entities/catalogs.ts';
import { DEBT_STRATEGIES, DEBT_STRATEGY_LABELS } from '../../domain/entities/catalogs.ts';
import {
  ETIQUETA_MONEDA,
  simboloDe,
} from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/deuda-estrategia.css';

interface Props {
  readonly estrategia: DebtStrategy;
  readonly extra: number;
  readonly onCambioEstrategia: (nueva: DebtStrategy) => void;
  readonly onCambioExtra: (nuevo: number) => void;
}

export function PanelEstrategia({
  estrategia,
  extra,
  onCambioEstrategia,
  onCambioExtra,
}: Props) {
  const moneda = usarMoneda();
  const simbolo = simboloDe(moneda);
  return (
    <section className="deuda-section__tarjeta" aria-label="Estrategia y pago extra">
      <h3 className="deuda-section__subtitulo">Estrategia de ataque</h3>
      <fieldset className="deuda-section__estrategia">
        <legend>Elige cómo atacar tus deudas</legend>
        {DEBT_STRATEGIES.map((strat) => (
          <label key={strat} className="deuda-section__radio">
            <input
              type="radio"
              name="debt-strategy"
              value={strat}
              checked={estrategia === strat}
              onChange={() => onCambioEstrategia(strat)}
            />
            <span className="deuda-section__radio-label">{DEBT_STRATEGY_LABELS[strat]}</span>
          </label>
        ))}
      </fieldset>
      <div className="deuda-section__extra">
        <label htmlFor="extra-pago" className="deuda-section__extra-label">
          Pago extra mensual ({simbolo}):
        </label>
        <input
          id="extra-pago"
          type="number"
          step="0.01"
          min="0"
          value={extra}
          onChange={(e) => onCambioExtra(Number(e.target.value) || 0)}
          className="deuda-section__extra-input"
          aria-label={`Pago extra mensual en ${ETIQUETA_MONEDA[moneda].toLowerCase()}`}
        />
      </div>
    </section>
  );
}
