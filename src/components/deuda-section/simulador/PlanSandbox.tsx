// Plan sandbox multi-crédito (REQ-15-03): lista local de créditos
// hipotéticos, selector de estrategia (tokens de F9) y orden de ataque
// con intereses por escenario devueltos por el motor de plan-deuda.
import type { CreditoSimulado, EstrategiaSandbox } from '../../../domain/entities/simulador-credito.ts';
import type { EscenarioEstrategia } from '../../../domain/entities/simulador-plan.ts';
import { DEBT_STRATEGIES, DEBT_STRATEGY_LABELS } from '../../../domain/entities/catalogs.ts';
import { formatoMoneda } from '../../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../../hooks/use-moneda.ts';

interface Props {
  readonly creditos: readonly CreditoSimulado[];
  readonly estrategia: EstrategiaSandbox;
  readonly escenarios: readonly EscenarioEstrategia[] | null;
  readonly onEstrategia: (nueva: EstrategiaSandbox) => void;
  readonly onQuitar: (indice: number) => void;
  readonly onComparar: () => void;
}

function TarjetaEscenario(
  escenario: EscenarioEstrategia,
  activa: boolean,
  moneda: ReturnType<typeof usarMoneda>,
) {
  const clase = `simulador-plan__escenario${activa ? ' simulador-plan__escenario--activa' : ''}`;
  return (
    <article key={escenario.estrategia} className={clase}>
      <h5>{DEBT_STRATEGY_LABELS[escenario.estrategia]}</h5>
      <p>Orden de ataque: {escenario.orden_de_ataque.join(' → ')}</p>
      <p>Objetivo: {escenario.deuda_objetivo ?? '—'}</p>
      <p>
        Base: {escenario.meses_base} meses y {formatoMoneda(escenario.intereses_base, moneda)} de
        intereses.
      </p>
      <p>
        Optimizado: {escenario.meses_optimizado} meses y{' '}
        {formatoMoneda(escenario.intereses_optimizado, moneda)} de intereses.
      </p>
      <p className="simulador-plan__ahorro">
        Ahorro: {escenario.meses_ahorrados} meses y{' '}
        <strong>{formatoMoneda(escenario.intereses_ahorrados, moneda)}</strong>.
      </p>
    </article>
  );
}

export function PlanSandbox({ creditos, estrategia, escenarios, onEstrategia, onQuitar, onComparar }: Props) {
  const moneda = usarMoneda();
  return (
    <section className="card simulador-plan" aria-label="Plan sobre varios créditos simulados">
      <div className="card__cabecera">
        <h3 className="card__titulo">Comparativa por estrategia</h3>
        <div className="segmentado" role="radiogroup" aria-label="Estrategia de la comparativa">
          {DEBT_STRATEGIES.map((valor) => (
            <button key={valor} type="button" role="radio" className="segmentado__opcion"
              aria-checked={estrategia === valor} onClick={() => onEstrategia(valor)}>
              {DEBT_STRATEGY_LABELS[valor]}
            </button>
          ))}
        </div>
      </div>
      {creditos.length > 0 && (
        <ul className="simulador-plan__lista">
          {creditos.map((credito, indice) => (
            <li key={`${credito.nombre}-${indice}`}>
              {credito.nombre}: {formatoMoneda(credito.importe, moneda)} a {credito.plazo_meses} meses
              ({credito.tasa_interes_anual} %).{' '}
              <button type="button" className="btn btn--fantasma btn--sm" onClick={() => onQuitar(indice)}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
      {creditos.length === 0 ? (
        <p className="card__descripcion">Calcula un crédito y pulsa «Añadir este crédito a la comparativa» para compararlo aquí.</p>
      ) : null}
      <button type="button" className="btn btn--primario simulador__accion" onClick={onComparar} disabled={creditos.length === 0}>
        Comparar estrategias
      </button>
      {escenarios !== null && (
        <div className="rejilla rejilla--2">{escenarios.map((e) => TarjetaEscenario(e, e.estrategia === estrategia, moneda))}</div>
      )}
    </section>
  );
}
